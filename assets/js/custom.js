// Track visit count (used for returning-visitor class and tagline tiers)
var visitKey = 'visitCount';
var visitCount = parseInt(localStorage.getItem(visitKey) || '0', 10) + 1;
localStorage.setItem(visitKey, String(visitCount));

// Faster fade-in for returning visitors, slower for first-timers
if (visitCount > 1) {
  document.documentElement.classList.add('returning-visitor');
}

// Random tagline
$(document).ready(function () {
  // Taglines are injected by Hugo from data/taglines.json via window.siteTaglines
  var taglineData = window.siteTaglines || {};
  function splitLines(s) {
    return (s || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  }
  var seriousTags = Array.isArray(taglineData.serious)
    ? taglineData.serious
    : splitLines(taglineData.serious);
  if (!seriousTags.length) seriousTags = ["Gender equality, socialism, and a hollow Earth."];
  var funnyTags = Array.isArray(taglineData.funny)
    ? taglineData.funny
    : splitLines(taglineData.funny);
  var funnyThreshold = taglineData.funnyThreshold || 3;

  var seriousRecentKey = 'recentSerious';
  var funnyRecentKey = 'recentFunny';
  var lastTierKey = 'lastTagTier';

  // Tier 3: ARG taglines, unlocked by discovering mysteries on the site
  var argTags = Array.isArray(taglineData.arg)
    ? taglineData.arg
    : splitLines(taglineData.arg);
  var argRecentKey = 'recentArg';
  var argUnlocked = localStorage.getItem('arg_illumination_seen') || localStorage.getItem('arg_seven_sisters');

  function pickFrom(pool, key) {
    var recent = JSON.parse(localStorage.getItem(key) || '[]');
    recent = recent.filter(function (i) { return i >= 0 && i < pool.length; });
    var recentSet = new Set(recent);
    var allIndices = pool.map(function (_, i) { return i; });
    var available = allIndices.filter(function (i) { return !recentSet.has(i); });
    if (available.length === 0) {
      recent = [];
      available = allIndices;
    }
    var pickedIndex = available[Math.floor(Math.random() * available.length)];
    recent.push(pickedIndex);
    if (recent.length > pool.length) recent.shift();
    localStorage.setItem(key, JSON.stringify(recent));
    return pool[pickedIndex];
  }

  function pickTagline() {
    var unlocked = visitCount > funnyThreshold;
    var lastTier = localStorage.getItem(lastTierKey) || 'funny';

    // ARG tier: 50% chance if mysteries have been discovered
    if (argUnlocked && argTags.length && Math.random() < 0.50) {
      return pickFrom(argTags, argRecentKey);
    }

    if (!unlocked || lastTier === 'funny') {
      localStorage.setItem(lastTierKey, 'serious');
      return pickFrom(seriousTags, seriousRecentKey);
    } else {
      localStorage.setItem(lastTierKey, 'funny');
      return pickFrom(funnyTags, funnyRecentKey);
    }
  }

  $('#tagline').text(pickTagline());

  // Auto-cycle every 6 seconds
  setInterval(function () {
    $('#tagline').fadeOut(400, function () {
      $(this).text(pickTagline()).fadeIn(400);
    });
  }, 6000);
});

// Close modal on Escape key
$(document).on('keydown', function (e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    $('.modal.is-active').removeClass('is-active');
    $('html').removeClass('modal-open');
  }
});

// Close modal when clicking the background overlay
$('.modal-background').click(function () {
  $(this).closest('.modal').removeClass('is-active');
  $('html').removeClass('modal-open');
});

// ============================================================
// ARG: THE KORESHAN MYSTERIES
// Hidden puzzles and easter eggs woven throughout the site.
// "The Flaming Sword lights the way."
// ============================================================

// --- Console Messages ---
(function () {
  var sh = 'font-size:20px;font-weight:bold;color:#cb3727;font-family:serif;text-shadow:1px 1px 2px rgba(0,0,0,.3)';
  var sb = 'font-size:13px;color:#4a4836;font-style:italic;line-height:1.8';
  var st = 'font-size:11px;color:#a02c1f;font-family:monospace';
  console.log('%c\u2694 THE FLAMING SWORD \u2694', sh);
  console.log(
    '%c\u201cYou have peered behind the veil.\n' +
    'The Unity welcomes those who seek.\n\n' +
    'In the hollow of the Earth, truth curves inward.\n' +
    'Eight inches to the mile \u2014 but which direction?\u201d\n\n' +
    '\u2014 From the recovered papers of Cyrus R. Teed, 1898',
    sb
  );
  console.log('%c\u2609 The Rectilineator measures all things.', st);
})();

// --- Console Properties (discoverable by curious devs) ---
(function () {
  var props = {
    koresh: 'I am the shepherd. I have seen the light in the laboratory. Seek the seven truths.',
    victoria: 'She is coming. She has always been coming. The transfer was foretold.',
    emma: 'Sister Emma tends the vigil. She counts the hours. How many hours until faith becomes folly?',
    hollow: 'We live inside. The concavity is eight inches to the mile. The Rectilineator proves all.',
    sword: 'The Flaming Sword was our voice. It published truth from 1889 until the fire of 1949. Its embers still glow.',
    tub: 'The body rests in zinc and water. We wait. We have always been waiting.',
  };
  Object.keys(props).forEach(function (k) {
    Object.defineProperty(window, k, { get: function () { return props[k]; } });
  });
  // Caesar cipher decoder — the key is 8 ("eight inches to the mile")
  window.rectilineator = function (text, shift) {
    if (!text) return 'Feed me ciphertext. The key is the measure of the Earth\u2019s concavity.';
    shift = shift || 8;
    return text.replace(/[a-zA-Z]/g, function (c) {
      var base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26) % 26) + base);
    });
  };
})();

// --- Konami Code or typing "KORESH": The Illumination ---
(function () {
  var seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  var idx = 0;
  var word = 'KORESH';
  var wIdx = 0;
  document.addEventListener('keydown', function (e) {
    // Konami code
    if (e.keyCode === seq[idx]) {
      idx++;
      if (idx === seq.length) { showIllumination(); idx = 0; wIdx = 0; }
    } else { idx = 0; }
    // Typing "KORESH"
    var key = (e.key || '').toUpperCase();
    if (key === word[wIdx]) {
      wIdx++;
      if (wIdx === word.length) { showIllumination(); wIdx = 0; idx = 0; }
    } else if (key === word[0]) {
      wIdx = 1;
    } else {
      wIdx = 0;
    }
  });
  function showIllumination() {
    if (document.getElementById('arg-illumination')) return;
    var el = document.createElement('div');
    el.id = 'arg-illumination';
    el.innerHTML =
      '<div class="arg-ill-inner">' +
      '<p class="arg-ill-line" style="animation-delay:.5s">In the autumn of 1869,</p>' +
      '<p class="arg-ill-line" style="animation-delay:1.8s">in a laboratory in Utica, New York,</p>' +
      '<p class="arg-ill-line" style="animation-delay:3.2s">Cyrus Teed beheld a woman wreathed in light.</p>' +
      '<p class="arg-ill-line" style="animation-delay:5s">She revealed seven truths.</p>' +
      '<p class="arg-ill-line arg-ill-blood" style="animation-delay:6.8s">The seventh was never written down.</p>' +
      '<p class="arg-ill-line arg-ill-dim" style="animation-delay:9s">Until now.</p>' +
      '<p class="arg-ill-line arg-ill-path" style="animation-delay:11s">/ i l l u m i n a t i o n /</p>' +
      '</div>';
    document.body.appendChild(el);
    localStorage.setItem('arg_illumination_seen', 'true');
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 15000);
    function dismiss() {
      if (!el.parentNode) return;
      el.classList.add('arg-ill-out');
      setTimeout(function () { el.remove(); }, 1200);
    }
  }
})();

// --- Hero Emblem: Seven Sisters (click the angel 7 times) ---
$(document).ready(function () {
  var clicks = 0, timer;
  var $emblem = $('.hero-emblem');
  if (!$emblem.length) return;
  $emblem.on('click', function (e) {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    if (clicks >= 7) {
      $('body').css('filter', 'invert(1) sepia(1)');
      setTimeout(function () { $('body').css('filter', ''); }, 200);
      setTimeout(function () { $('body').css('filter', 'invert(1)'); }, 350);
      setTimeout(function () { $('body').css('filter', ''); }, 500);
      $('#tagline').fadeOut(200, function () {
        $(this).html('Seven sisters. Seven truths. <em>One still waits.</em>').fadeIn(600);
      });
      localStorage.setItem('arg_seven_sisters', 'true');
      clicks = 0;
      return;
    }
    timer = setTimeout(function () { clicks = 0; }, 2500);
  });
});

// --- Title Glitch (rare, ~8% of page loads) ---
(function () {
  if (Math.random() > 0.08) return;
  $(document).ready(function () {
    var $t = $('.bold-title');
    if (!$t.length) return;
    var orig = $t.html();
    var ghosts = [
      ['Koresh', 'Lives'],
      ['She Is', 'Coming'],
      ['We Live', 'Inside'],
      ['Eight', 'Inches'],
    ];
    setTimeout(function () {
      $t.css('opacity', '1');
      $t.addClass('arg-glitch');
      setTimeout(function () {
        var ghost = ghosts[Math.floor(Math.random() * ghosts.length)];
        $t.html(
          '<span class="title-line">' + ghost[0] + '</span>' +
          '<span class="title-of">&nbsp;</span>' +
          '<span class="title-line">' + ghost[1] + '</span>'
        );
        setTimeout(function () { $t.html(orig).removeClass('arg-glitch'); }, 3000);
      }, 60);
    }, Math.random() * 10000 + 5000);
  });
})();

// --- Tab Title Glitch (rare, periodic) ---
(function () {
  var orig = document.title;
  var ghosts = [
    'SHE IS COMING', 'WE LIVE INSIDE', 'THE TUB AWAITS',
    'KORESH LIVES', 'EIGHT INCHES PER MILE', 'VICTORIA',
    'THE SEVENTH TRUTH', 'SEEK THE ILLUMINATION',
  ];
  setInterval(function () {
    if (Math.random() < 0.03 && !document.hidden) {
      document.title = ghosts[Math.floor(Math.random() * ghosts.length)];
      setTimeout(function () { document.title = orig; }, 2500);
    }
  }, 30000);
})();

// --- Hidden selectable text & data attributes ---
$(document).ready(function () {
  var $lions = $('.lions-footer');
  if ($lions.length) {
    $lions.after(
      '<span class="unity-whisper" aria-hidden="true">' +
      'She is waiting in the hollow. The sword lights the way. /flaming-sword/' +
      '</span>'
    );
  }
  // Embed Koreshan State Park coordinates in blog post images
  $('.container.markdown img').each(function (i) {
    $(this).attr('data-unity', 'N26.4324 W81.8126');
    if (i === 0) {
      $(this).attr('data-message', 'DQKBWZQI TQDMA');
    }
  });
});
