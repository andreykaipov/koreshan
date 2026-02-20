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
