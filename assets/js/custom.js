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
  function argUnlocked() {
    return localStorage.getItem('arg_illumination_seen') || localStorage.getItem('arg_seven_sisters');
  }

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

    // When ARG is unlocked, rotate: serious → arg → funny → arg → serious → ...
    // ARG taglines appear twice as often as the others.
    if (argUnlocked() && argTags.length && unlocked) {
      if (lastTier === 'serious') {
        localStorage.setItem(lastTierKey, 'arg1');
        return pickFrom(argTags, argRecentKey);
      } else if (lastTier === 'arg1') {
        localStorage.setItem(lastTierKey, 'funny');
        return pickFrom(funnyTags, funnyRecentKey);
      } else if (lastTier === 'funny') {
        localStorage.setItem(lastTierKey, 'arg2');
        return pickFrom(argTags, argRecentKey);
      } else {
        localStorage.setItem(lastTierKey, 'serious');
        return pickFrom(seriousTags, seriousRecentKey);
      }
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
  var taglineCycler = setInterval(function () {
    $('#tagline').fadeOut(400, function () {
      $(this).text(pickTagline()).fadeIn(400);
    });
  }, 6000);

  // Expose cycler control for ARG events
  window._taglineCycler = taglineCycler;
  window._pickTagline = pickTagline;
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
  var sh = 'font-size:20px;font-weight:bold;color:#e8453a;font-family:serif;text-shadow:1px 1px 2px rgba(0,0,0,.3);background:#1a1a18;padding:6px 12px';
  var sb = 'font-size:13px;color:#c2b99a;font-style:italic;line-height:1.8;background:#1a1a18;padding:4px 12px';
  var st = 'font-size:11px;color:#d4584a;font-family:monospace;background:#1a1a18;padding:4px 12px';
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

// --- Secret passcodes: The Illumination ---
(function () {
  var seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  var idx = 0;
  var words = ['KORESH', 'CYRUS', 'TEED', 'VICTORIA', 'HOLLOW', 'ESTERO', 'SWORD', 'SEVEN'];
  var wIdxs = words.map(function () { return 0; });
  document.addEventListener('keydown', function (e) {
    // Konami code
    if (e.keyCode === seq[idx]) {
      idx++;
      if (idx === seq.length) { showIllumination(); idx = 0; wIdxs = words.map(function () { return 0; }); }
    } else { idx = 0; }
    // Typed words
    var key = (e.key || '').toUpperCase();
    for (var i = 0; i < words.length; i++) {
      if (key === words[i][wIdxs[i]]) {
        wIdxs[i]++;
        if (wIdxs[i] === words[i].length) {
          showIllumination();
          wIdxs = words.map(function () { return 0; });
          idx = 0;
          return;
        }
      } else if (key === words[i][0]) {
        wIdxs[i] = 1;
      } else {
        wIdxs[i] = 0;
      }
    }
  });
  function showIllumination() {
    if (document.getElementById('arg-illumination')) return;
    var el = document.createElement('div');
    el.id = 'arg-illumination';
    el.innerHTML =
      '<div class="arg-ill-inner">' +
      '<p class="arg-ill-line" style="animation-delay:1.5s">In the autumn of 1869,</p>' +
      '<p class="arg-ill-line" style="animation-delay:4.5s">in a laboratory in Utica, New York,</p>' +
      '<p class="arg-ill-line" style="animation-delay:8s">Cyrus Teed beheld a woman wreathed in light.</p>' +
      '<p class="arg-ill-line" style="animation-delay:12s">She revealed seven truths.</p>' +
      '<p class="arg-ill-line arg-ill-blood" style="animation-delay:17s">The seventh was never written down.</p>' +
      '<p class="arg-ill-line arg-ill-dim" style="animation-delay:21s">Until now.</p>' +
      '<p class="arg-ill-line arg-ill-path" style="animation-delay:25s">/ i l l u m i n a t i o n /</p>' +
      '</div>';
    document.body.appendChild(el);
    localStorage.setItem('arg_illumination_seen', 'true');
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 36000);
    function dismiss() {
      if (!el.parentNode) return;
      el.classList.add('arg-ill-out');
      setTimeout(function () { el.remove(); }, 1200);
    }
  }
})();

// --- Hero Emblem: Seven Sisters (click the angel 5 times — five days of vigil) ---
$(document).ready(function () {
  var clicks = 0, timer;
  var $emblem = $('.hero-emblem');
  if (!$emblem.length) return;
  $emblem.on('click', function (e) {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    if (clicks >= 5) {
      // Flash subliminal clue during screen inversions
      var clue = document.createElement('div');
      clue.className = 'arg-flash arg-flash-emblem';
      clue.textContent = '/planetary-court/';
      document.body.appendChild(clue);

      $('body').css('filter', 'invert(1) sepia(1)');
      setTimeout(function () { $('body').css('filter', ''); }, 200);
      setTimeout(function () { $('body').css('filter', 'invert(1)'); }, 350);
      setTimeout(function () { $('body').css('filter', ''); }, 500);
      setTimeout(function () { $('body').css('filter', 'invert(1)'); }, 650);
      setTimeout(function () { $('body').css('filter', ''); }, 800);
      setTimeout(function () { $('body').css('filter', 'invert(1)'); }, 950);
      setTimeout(function () { $('body').css('filter', ''); clue.remove(); }, 1100);
      $('#tagline').fadeOut(200, function () {
        $(this).html('Seven sisters. Seven truths. <a href="/planetary-court/" style="color:inherit !important;text-decoration:none !important"><em>One still waits.</em></a>').fadeIn(600);
      });
      localStorage.setItem('arg_seven_sisters', 'true');
      // Pause the tagline cycler, resume after 30 seconds
      clearInterval(window._taglineCycler);
      setTimeout(function () {
        window._taglineCycler = setInterval(function () {
          $('#tagline').fadeOut(400, function () {
            $(this).text(window._pickTagline()).fadeIn(400);
          });
        }, 6000);
      }, 30000);
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

// ============================================================
// ARG LAYER 2: DEEPER MYSTERIES
// "The deeper you look, the more the hollow reveals."
// ============================================================

// --- The Vigil: idle watcher ---
// If you sit on the homepage for 3+ minutes without interacting,
// the screen dims and a message appears — like the followers
// waiting by Teed's bathtub.
(function () {
  if (!$('.hero-emblem').length) return; // homepage only
  var vigilTimer, vigilActive = false;
  var idleTime = 180 * 1000; // 180s

  function resetVigil() {
    if (vigilActive) return; // don't dismiss — only a click on the overlay dismisses
    clearTimeout(vigilTimer);
    if (document.hidden) return; // don't start timer while tab is unfocused
    vigilTimer = setTimeout(startVigil, idleTime);
  }

  function startVigil() {
    if (vigilActive || document.hidden || !document.hasFocus()) return;
    vigilActive = true;
    var el = document.createElement('div');
    el.id = 'arg-vigil';
    el.innerHTML =
      '<div class="arg-vigil-inner">' +
      '<p class="arg-vigil-line" style="animation-delay:0s">You are still here.</p>' +
      '<p class="arg-vigil-line" style="animation-delay:4s">So were they.</p>' +
      '<p class="arg-vigil-line" style="animation-delay:8s">December 22, 1908.</p>' +
      '<p class="arg-vigil-line" style="animation-delay:12s">The body in the tub. The sisters in prayer.</p>' +
      '<p class="arg-vigil-line" style="animation-delay:16s">How long will you wait?</p>' +
      '<p class="arg-vigil-line arg-ill-dim" style="animation-delay:20s">They waited five days.</p>' +
      '<p class="arg-vigil-line" style="animation-delay:24s">The messenger watches. The messenger listens.</p>' +
      '<p class="arg-vigil-line arg-ill-dim" style="animation-delay:30s">How will you answer?</p>' +
      '</div>';
    document.body.appendChild(el);
    localStorage.setItem('arg_vigil_kept', 'true');
    el.addEventListener('click', dismissVigil);
  }

  function dismissVigil() {
    var el = document.getElementById('arg-vigil');
    if (!el) return;
    vigilActive = false;
    el.classList.add('arg-ill-out');
    setTimeout(function () { el.remove(); }, 1200);
    resetVigil();
  }

  ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, resetVigil, { passive: true });
  });

  // Pause idle timer when tab/window loses focus; restart when it returns.
  // Use both visibilitychange AND blur/focus because on macOS, Cmd+Tab
  // may not trigger visibilitychange if the window is still partially visible.
  function pauseVigil() {
    clearTimeout(vigilTimer);
    if (vigilActive) dismissVigil();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseVigil(); else resetVigil();
  });
  window.addEventListener('blur', pauseVigil);
  window.addEventListener('focus', resetVigil);

  resetVigil();
})();

// --- December 22: The Death Anniversary ---
// On the anniversary of Teed's death, the site behaves differently.
(function () {
  var now = new Date();
  if (now.getMonth() !== 11 || now.getDate() !== 22) return; // Dec 22 only
  document.documentElement.classList.add('death-anniversary');

  $(document).ready(function () {
    // Replace tagline with something solemn
    $('#tagline').text('On this day in 1908, the shepherd departed.');

    // Override the tagline cycler — freeze it
    setTimeout(function () {
      $('#tagline').stop(true, true).css('opacity', '1');
    }, 100);

    // Add a memorial whisper at the top
    $('body').prepend(
      '<div class="anniversary-banner">' +
      '<span>In Memoriam \u00b7 Cyrus R. Teed \u00b7 December 22, 1908</span>' +
      '</div>'
    );
  });
})();

// --- Deeper Console: The Planetary Court ---
// Typing specific words in the console reveals deeper lore.
(function () {
  var deeper = {
    anastasia: '"We the disciples of Koresh, Shepherd, Stone of Israel, know that this sepulcher cannot hold his body." I sealed this testament inside the mausoleum wall. The hurricane took the stone. It did not take the words. - Sister Anastasia',
    damkohler: 'Gustave Damkohler. German immigrant. Homesteader on the Estero River since 1882. He never heard Teed speak, only read his pamphlet. For $200 he sold 300 acres of his life to a stranger\'s dream. Was he a fool, or did he see what we could not?',
    morrow: 'Professor Ulysses Grant Morrow designed the Rectilineator and led the Geodetic Survey of 1897. The apparatus was built of seasoned mahogany and brass. It measured concavity at Naples Beach. The results were published. The world did not listen.',
    hedwig: 'Hedwig Michel. Born in Germany. Fled the Nazis. Found the Koreshans. Became the last one. She said: "I found in The Koreshan Unity the mission for my life work, complete fulfillment." She died in 1982, the last believer in a hollow Earth, buried in the park where paradise was supposed to rise.',
    bethophra: 'Beth-Ophra. The House of the Rising Sun. The commune in Chicago, 1888. One hundred and twenty souls seeking a New Jerusalem. They found it in the swamps of Florida. Or thought they did.',
    planetarycourt: 'The Planetary Court housed the Seven Sisters, the women who governed the Unity. Teed placed women in power because a woman had appeared to him in the laboratory. Seven truths from a woman of light. Seven sisters to carry them forward. The court still stands in Koreshan State Park. The sisters are gone. /planetary-court/',
  };
  Object.keys(deeper).forEach(function (k) {
    Object.defineProperty(window, k, {
      get: function () { return deeper[k]; },
    });
  });
})();

// --- Hauntings: the site whispers back ---
// Rare, atmospheric disturbances as you browse — whispered
// messages at screen edges and brief text possessions.
(function () {
  var lastHaunt = 0;
  // ARG pages get much more frequent hauntings
  var isArgPage = /\/(flaming-sword|illumination|planetary-court)(\/|$)/.test(window.location.pathname);
  var cooldown = isArgPage ? 5000 : 15000;
  var hauntChance = isArgPage ? 0.05 : 0.006;

  var whispers = [
    'She is still waiting…',
    'The hollow remembers.',
    'Five days by the tub.',
    'We live inside.',
    'Victoria is coming.',
    'The seventh truth...',
    'Seek the illumination.',
    'The messenger watches.',
    'Eight inches to the mile.',
    'The sword still burns.',
  ];

  function haunt() {
    var now = Date.now();
    if (now - lastHaunt < cooldown) return;
    if (Math.random() > hauntChance) return;
    lastHaunt = now;

    // Text possession: swap a single word inside a visible paragraph
    var paragraphs = document.querySelectorAll('.container p, .content p');
    if (!paragraphs.length) return;
    var visible = Array.prototype.filter.call(paragraphs, function (p) {
      var rect = p.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight && p.textContent.trim().length > 20;
    });
    if (!visible.length) return;
    var target = visible[Math.floor(Math.random() * visible.length)];
    // Find text nodes with actual words
    var walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim().length > 1) textNodes.push(node);
    }
    if (!textNodes.length) return;
    var chosenNode = textNodes[Math.floor(Math.random() * textNodes.length)];
    var originalText = chosenNode.textContent;

    // Koreshan replacement words, roughly grouped by length
    var koreshWords = {
      short: ['tub', 'sin', 'ark', 'vow', 'orb', 'ash', 'rib', 'elm', 'woe', 'fog', 'urn', 'hymn'],
      medium: ['vigil', 'sword', 'unity', 'seven', 'hollow', 'Estero', 'Koresh', 'biune', 'vesper', 'cipher', 'ember', 'relic', 'ritual', 'schism', 'zealot', 'vision', 'temple'],
      long: ['Victoria', 'concavity', 'illumination', 'planetary', 'messenger', 'celestial', 'rectilineator', 'cosmogony', 'mausoleum', 'transfigure', 'resurrection', 'prophecy', 'sepulcher', 'Damkohler', 'Anastasia'],
    };

    // Find word boundaries in the text node
    var wordRegex = /[a-zA-Z]{3,}/g;
    var matches = [];
    var m;
    while (m = wordRegex.exec(originalText)) {
      matches.push({ word: m[0], index: m.index });
    }
    if (!matches.length) return;
    var pick = matches[Math.floor(Math.random() * matches.length)];

    // Choose a Koreshan replacement of similar length
    var bucket = pick.word.length <= 3 ? 'short' : pick.word.length <= 6 ? 'medium' : 'long';
    var pool = koreshWords[bucket];
    var replacement = pool[Math.floor(Math.random() * pool.length)];
    // Match capitalization
    if (pick.word[0] === pick.word[0].toUpperCase()) {
      replacement = replacement[0].toUpperCase() + replacement.slice(1);
    } else {
      replacement = replacement[0].toLowerCase() + replacement.slice(1);
    }

    // Use Range to surgically replace just the word
    var range = document.createRange();
    range.setStart(chosenNode, pick.index);
    range.setEnd(chosenNode, pick.index + pick.word.length);
    range.deleteContents();
    var span = document.createElement('span');
    span.className = 'arg-possessed';
    span.textContent = replacement;
    range.insertNode(span);

    var restored = false;
    function restore() {
      if (restored) return;
      restored = true;
      var text = document.createTextNode(pick.word);
      span.parentNode.replaceChild(text, span);
      // Normalize to merge adjacent text nodes back together
      target.normalize();
    }

    // Snap back immediately if the user hovers over it
    span.addEventListener('mouseenter', restore);
    setTimeout(restore, 2500);
  }

  document.addEventListener('mousemove', haunt, { passive: true });
  document.addEventListener('scroll', haunt, { passive: true });
})();

// --- Scroll Depth: Bottom of the World ---
// When you scroll to the absolute bottom of any page, a hidden message fades in.
$(document).ready(function () {
  var revealed = false;
  var $footer = $('#footer');
  if (!$footer.length) return;

  $footer.append(
    '<div class="arg-bottom-whisper" aria-hidden="true">' +
    'You have reached the bottom of the world. ' +
    'But remember — in a hollow Earth, the bottom is also the top. ' +
    'The Planetary Court awaits those who have come this far.' +
    '</div>'
  );

  $(window).on('scroll', function () {
    if (revealed) return;
    var scrollBottom = $(window).scrollTop() + $(window).height();
    var docHeight = $(document).height();
    if (scrollBottom >= docHeight - 10) {
      revealed = true;
      $('.arg-bottom-whisper').addClass('arg-bottom-visible');
    }
  });
});
