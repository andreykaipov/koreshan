// Faster fade-in for returning visitors, slower for first-timers
if (localStorage.getItem('visited')) {
  document.documentElement.classList.add('returning-visitor');
} else {
  localStorage.setItem('visited', 'true');
}

// Random tagline
$(document).ready(function () {
  // Tier 1: On-brand, shown from the start
  var seriousTags = [
    "We live inside!",
    "Come and be healed!",
    "Victoria is coming.",
    "Emma kept the faith.",
    "Salvation is upon us.",
    "Cosmogeny is the truth.",
    "A New Jerusalem awaits.",
    "The stars are beneath us.",
    "I am Koresh, the shepherd.",
    "Immortality through unity.",
    "We are the Victoria Gratia.",
    "The body awaits in the tub.",
    "The sun is inside the Earth.",
    "Sister Emma tends the vigil.",
    "The transfer has been foretold.",
    "Have you accepted Koresh as your leader?",
    "Gender equality, socialism, and a hollow Earth.",
  ];

  // Tier 2: Meta jokes, unlocked after seeing enough core taglines
  var funnyTags = [
    // waiting
    "Resurrection to be determined.",
    "Darn, straight to voicemail...",
    "Invites will be sent out shortly.",
    "Have faith. OP will surely deliver.",
    // tub
    "Scrub-a-dub-dub, I love my tub.",
    "The tub is ready. Are you to ready to bathe me?",
    "How long do you think a body lasts in a zinc tub?",
    "He's not dead. We're transferring your call right now.",
    // florida
    "Celibate, socialist, Floridian.",
    "The most Florida thing to ever happen.",
    "Florida Man starts cult. Here's Tom with the weather.",
    // 8 ball esque
    "Try asking again later.",
    "Refresh for another prophecy.",
    "This prophecy is still loading...",
    // lame jokes but not that lame
    "Hollow World!",
    "Join us. We have electricity.",
    "Communists with a corporation.",
    "Apply within. Celibacy required.",
    "No marriage. No money. No problem.",
    "Free real estate in Estero, Florida.",
    "They were right about gender equality, at least.",
    // even lamer jokes
    "Hollow Earth? I hardly know her!",
    "I'm somewhat of a prophet myself.",
    "I like my Earths concave. Don't convex me.",
    "The Earth is hollow but our promises aren't.",
    "I joined a cult and all I got was this lousy tagline.",
  ];

  var visitKey = 'visitCount';
  var funnyThreshold = 3; // unlock funny tags after 3rd visit

  // Track visit count
  var visitCount = parseInt(localStorage.getItem(visitKey) || '0', 10) + 1;
  localStorage.setItem(visitKey, String(visitCount));

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
