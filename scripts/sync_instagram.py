#!/usr/bin/env python3
"""
Sync Instagram posts from multiple accounts to the Hugo site.

Accounts:
- @fried.works (primary author)
- @lastdaysofkoreshan (secondary author)

For each new Instagram post:
1. Downloads images to static/img/blog/<folder>/
2. Creates a Hugo content file at content/blog/<folder>/index.md
3. Includes both local images and an Instagram embed

Detects already-synced posts by scanning instagram_url in existing frontmatter.
"""

from __future__ import annotations

import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import instaloader

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
LOOKBACK_DAYS = 3  # Only check posts from the last N days
MAX_VIDEO_SIZE_MB = 20  # Compress videos to stay under Cloudflare's 25MB limit
DELAY_BETWEEN_ACCOUNTS = 5  # Seconds to wait between fetching different accounts
MAX_CONNECTION_ATTEMPTS = 3  # Don't retry forever on 429s
INSTAGRAM_ACCOUNTS = [
    {
        "username": "fried.works",
        "author": "L. Fried",
        "category": "news",
        "tags": '["production"]',
        "require_hashtags": ["lastdaysofkoreshan", "koreshan"],
    },
    {
        "username": "lastdaysofkoreshan",
        "author": "Last Days of Koreshan",
        "category": "news",
        "tags": '["production"]',
    },
]

REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = REPO_ROOT / "content" / "blog"
STATIC_IMG_DIR = REPO_ROOT / "static" / "img" / "blog"


def load_synced_shortcodes() -> set[str]:
    """Scan existing blog posts for instagram_url and extract shortcodes."""
    shortcodes = set()
    for md_file in CONTENT_DIR.rglob("index.md"):
        try:
            text = md_file.read_text()
        except Exception:
            continue
        for match in re.finditer(r'instagram_url:\s*"?https?://www\.instagram\.com/p/([A-Za-z0-9_-]+)', text):
            shortcodes.add(match.group(1))
    return shortcodes


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[''']", "", text)           # remove apostrophes
    text = re.sub(r"[^a-z0-9]+", "-", text)     # non-alnum → hyphens
    text = re.sub(r"-+", "-", text)             # collapse multiple hyphens
    return text.strip("-")


def caption_to_title(caption: str) -> str:
    """
    Extract a title from an Instagram caption.
    Uses the first sentence/line, truncated to a reasonable length.
    """
    if not caption:
        return "New Post"

    # Take the first line
    first_line = caption.split("\n")[0].strip()

    # Remove hashtags
    first_line = re.sub(r"#\w+", "", first_line).strip()

    # If there's a sentence-ending punctuation, cut there
    match = re.match(r"^(.+?[.!?])\s", first_line)
    if match:
        first_line = match.group(1)

    # Truncate to ~80 chars at a word boundary
    if len(first_line) > 80:
        first_line = first_line[:80].rsplit(" ", 1)[0] + "…"

    # If the remaining text is empty or too short, use a fallback
    if len(first_line) < 3:
        return "New Post"

    return first_line


def caption_to_body(caption: str) -> str:
    """
    Convert an Instagram caption to Markdown body text.
    Strips excessive hashtags at the end.
    """
    if not caption:
        return ""

    # Remove trailing block of hashtags
    body = re.sub(r"\n\n(?:#\w+\s*)+$", "", caption.strip())

    # Convert @mentions to plain text (no link needed)
    # Convert #hashtags to plain text
    body = re.sub(r"#(\w+)", r"\1", body)

    return body.strip()


def download_post_images(
    post: instaloader.Post, folder_name: str
) -> list[str]:
    """
    Download all images from an Instagram post to static/img/blog/<folder>/.
    Returns a list of markdown image references.
    """
    img_dir = STATIC_IMG_DIR / folder_name
    img_dir.mkdir(parents=True, exist_ok=True)

    L = instaloader.Instaloader(
        download_pictures=True,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        post_metadata_txt_pattern="",
    )

    image_paths: list[str] = []

    if post.typename == "GraphSidecar":
        # Carousel post — multiple images
        for idx, node in enumerate(post.get_sidecar_nodes(), start=1):
            if not node.is_video:
                filename = f"{idx}.jpg"
                filepath = img_dir / filename
                L.context.get_and_write_raw(node.display_url, str(filepath))
                image_paths.append(
                    f"![](/img/blog/{folder_name}/{filename})"
                )
    else:
        # Single image post
        filename = "1.jpg"
        filepath = img_dir / filename
        L.context.get_and_write_raw(post.url, str(filepath))
        image_paths.append(f"![](/img/blog/{folder_name}/{filename})")

    return image_paths


def download_post_video(
    post: instaloader.Post, folder_name: str
) -> str | None:
    """
    Download and compress a video from an Instagram post.
    Returns a markdown-compatible HTML video tag, or None on failure.
    """
    if not shutil.which("ffmpeg"):
        print("    ffmpeg not found, falling back to Instagram embed")
        return None

    img_dir = STATIC_IMG_DIR / folder_name
    img_dir.mkdir(parents=True, exist_ok=True)

    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=True,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        post_metadata_txt_pattern="",
    )

    raw_path = img_dir / "raw.mp4"
    final_path = img_dir / "1.mp4"

    try:
        L.context.get_and_write_raw(post.video_url, str(raw_path))
    except Exception as e:
        print(f"    Error downloading video: {e}")
        return None

    raw_size_mb = raw_path.stat().st_size / (1024 * 1024)
    print(f"    Raw video: {raw_size_mb:.1f} MB")

    if raw_size_mb <= MAX_VIDEO_SIZE_MB:
        # Small enough already — just rename
        raw_path.rename(final_path)
    else:
        # Compress with ffmpeg: target bitrate to fit under limit
        # Get duration first
        probe = subprocess.run(
            ["ffmpeg", "-i", str(raw_path)],
            capture_output=True, text=True
        )
        duration_match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", probe.stderr)
        if duration_match:
            h, m, s = duration_match.groups()
            duration_secs = int(h) * 3600 + int(m) * 60 + float(s)
        else:
            duration_secs = 60  # fallback estimate

        # Target bitrate: (target_size_bits) / duration, with some margin
        target_bits = MAX_VIDEO_SIZE_MB * 8 * 1024 * 1024 * 0.9
        video_bitrate = int(target_bits / duration_secs)

        print(f"    Compressing to ~{MAX_VIDEO_SIZE_MB}MB (bitrate: {video_bitrate // 1000}k)...")
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(raw_path),
                "-c:v", "libx264", "-b:v", str(video_bitrate),
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                "-preset", "medium",
                str(final_path),
            ],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"    ffmpeg error: {result.stderr[-200:]}")
            raw_path.unlink(missing_ok=True)
            return None

        raw_path.unlink(missing_ok=True)
        final_size_mb = final_path.stat().st_size / (1024 * 1024)
        print(f"    Compressed video: {final_size_mb:.1f} MB")

    video_url = f"/img/blog/{folder_name}/1.mp4"
    return (
        f'<video controls playsinline style="max-width:100%; width:540px; margin:auto; display:block;">'
        f'<source src="{video_url}" type="video/mp4">'
        f'</video>'
    )


def create_hugo_post(
    post: instaloader.Post,
    title: str,
    slug: str,
    folder_name: str,
    image_refs: list[str],
    account: dict,
    video_tag: str | None = None,
) -> Path:
    """Create the Hugo markdown file for a post."""
    post_dir = CONTENT_DIR / folder_name
    post_dir.mkdir(parents=True, exist_ok=True)

    post_date = post.date_utc.strftime("%Y-%m-%dT%H:%M:%S")
    instagram_url = f"https://www.instagram.com/p/{post.shortcode}/"
    body = caption_to_body(post.caption or "")
    author = account["author"]
    category = account["category"]
    tags = account["tags"]

    # Build the markdown content
    lines = [
        "---",
        f'title: "{title}"',
        f'author: "{author}"',
        f'category: "{category}"',
        f"date: {post_date}",
        f"tags: {tags}",
        f'slug: "{slug}"',
        f'instagram_url: "{instagram_url}"',
        "---",
        "",
        body,
        "",
    ]

    # Add local images
    for img_ref in image_refs:
        lines.append(img_ref)
        lines.append("")

    # Add Instagram embed for video posts with no images
    if not image_refs:
        if video_tag:
            lines.append(video_tag)
            lines.append("")
        else:
            lines.extend([
                f'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="{instagram_url}" style="max-width:540px; width:100%; margin:auto;"></blockquote>',
                '<script async src="//www.instagram.com/embed.js"></script>',
                "",
            ])

    filepath = post_dir / "index.md"
    filepath.write_text("\n".join(lines))
    return filepath


def sync_account(L: instaloader.Instaloader, account: dict, synced: set[str]) -> int:
    """
    Sync posts from a single Instagram account.
    Only checks posts from the last LOOKBACK_DAYS days.
    Returns the number of new posts synced.
    """
    username = account["username"]
    print(f"\nFetching profile: @{username}")
    profile = instaloader.Profile.from_username(L.context, username)
    print(f"Profile loaded: {profile.full_name} ({profile.mediacount} posts)")

    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    new_count = 0

    for post in profile.get_posts():
        # Posts are returned newest-first; stop once we pass the cutoff
        if post.date_utc.replace(tzinfo=timezone.utc) < cutoff:
            print(f"  Reached posts older than {LOOKBACK_DAYS} days, stopping.")
            break

        if post.shortcode in synced:
            print(f"  Skipping (already synced): {post.shortcode}")
            continue

        is_video_post = post.is_video and post.typename != "GraphSidecar"

        # Filter by required hashtags if configured
        require_hashtags = account.get("require_hashtags")
        if require_hashtags:
            caption_lower = (post.caption or "").lower()
            if not any(f"#{tag.lower()}" in caption_lower for tag in require_hashtags):
                continue

        print(f"  New post found: {post.shortcode} ({post.date_utc})")

        # Generate title and slug
        title = caption_to_title(post.caption or "")
        slug = slugify(title)
        date_prefix = post.date_utc.strftime("%Y-%m-%d")
        folder_name = f"{date_prefix}-{slug}"

        # Check for folder name collisions
        if (CONTENT_DIR / folder_name).exists():
            print(f"    Folder already exists: {folder_name}, skipping")
            continue

        # Download images (skip for video-only posts)
        image_refs = []
        video_tag = None
        if not is_video_post:
            print(f"    Downloading images...")
            try:
                image_refs = download_post_images(post, folder_name)
                print(f"    Downloaded {len(image_refs)} image(s)")
            except Exception as e:
                print(f"    Error downloading images: {e}")
        else:
            print(f"    Downloading and compressing video...")
            video_tag = download_post_video(post, folder_name)

        # Create Hugo post
        filepath = create_hugo_post(
            post, title, slug, folder_name, image_refs, account,
            video_tag=video_tag,
        )
        print(f"    Created: {filepath}")

        synced.add(post.shortcode)
        new_count += 1

        # Limit to 5 new posts per account per run
        if new_count >= 5:
            print("  Reached limit of 5 new posts per run.")
            break

    return new_count


def _try_login(L: instaloader.Instaloader) -> None:
    """
    Attempt to authenticate with Instagram using one of these methods
    (checked in order):

    1. INSTAGRAM_SESSION env var — base64-encoded session file previously
       exported with ``instaloader --login <user> --sessionfile <file>``.
    2. INSTAGRAM_USER / INSTAGRAM_PASS env vars — plain username + password.

    Falls back to anonymous access when no credentials are set.
    """
    session_b64 = os.environ.get("INSTAGRAM_SESSION", "").strip()
    if session_b64:
        try:
            raw = base64.b64decode(session_b64)
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".session")
            tmp.write(raw)
            tmp.close()
            L.load_session_from_file(username="_", filename=tmp.name)
            os.unlink(tmp.name)
            print(f"Loaded Instagram session (logged in as {L.context.username})")
            return
        except Exception as e:
            print(f"Warning: could not load INSTAGRAM_SESSION: {e}")

    ig_user = os.environ.get("INSTAGRAM_USER", "").strip()
    ig_pass = os.environ.get("INSTAGRAM_PASS", "").strip()
    if ig_user and ig_pass:
        try:
            L.login(ig_user, ig_pass)
            print(f"Logged in to Instagram as {ig_user}")
            return
        except Exception as e:
            print(f"Warning: Instagram login failed: {e}")

    print("Running without Instagram login (anonymous, lower rate limits)")


def sync() -> int:
    """
    Main sync function. Returns the number of new posts synced.
    """
    synced = load_synced_shortcodes()
    print(f"Already synced: {len(synced)} posts")

    # Initialize Instaloader
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        max_connection_attempts=MAX_CONNECTION_ATTEMPTS,
    )

    # Disable the iPhone API — GitHub Actions datacenter IPs get
    # rate-limited much harder on that endpoint.
    L.context.iphone_support = False

    # Authenticate if credentials are available (much higher rate limits).
    _try_login(L)

    total = 0
    for idx, account in enumerate(INSTAGRAM_ACCOUNTS):
        if idx > 0:
            print(f"\nWaiting {DELAY_BETWEEN_ACCOUNTS}s before next account...")
            time.sleep(DELAY_BETWEEN_ACCOUNTS)
        try:
            count = sync_account(L, account, synced)
            total += count
        except Exception as e:
            print(f"  Error syncing @{account['username']}: {e}")

    print(f"\nDone. Synced {total} new post(s) across {len(INSTAGRAM_ACCOUNTS)} account(s).")
    return total


if __name__ == "__main__":
    try:
        count = sync()
        # Set output for GitHub Actions
        github_output = os.environ.get("GITHUB_OUTPUT")
        if github_output:
            with open(github_output, "a") as f:
                f.write(f"new_posts={count}\n")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
