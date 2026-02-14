// Faster fade-in for returning visitors, slower for first-timers
if (localStorage.getItem('visited')) {
  document.documentElement.classList.add('returning-visitor');
} else {
  localStorage.setItem('visited', 'true');
}

// Random tagline
$(document).ready(function () {
  var taglines = [
    // Original
    "Hollow World!",
    "We live inside!",
    "Come and be healed!",
    "Salvation is upon us.",
    "A New Jerusalem awaits.",
    "Immortality through unity.",
    "Celibate, socialist, Floridian.",
    // Cult recruitment energy
    "Have you accepted Koresh as your leader?",
    "Join us. We have electricity.",
    "No marriage. No money. No problem.",
    "Free real estate in Estero, Florida.",
    "Step inside. The Earth is hollow.",
    "Apply within. Celibacy required.",
    // Florida
    "Florida Man starts cult. Here's Tom with the weather.",
    "The most Florida thing to ever happen.",
    "A tale of a Yankee-turned-Florida-Man.",
    "The Everglades wasn't ready for communism.",
    // Dark humor
    "He's not dead. He's transferring.",
    "Day 3. Still waiting by the bathtub.",
    "How long can a body last in a zinc tub?",
    "Resurrection TBD.",
    "The prophecy was unclear on this timeline.",
    "Have faith. OP will surely deliver.",
    "Trust the process.",
    // Meta / self-aware
    "Refresh for another prophecy.",
    "The Earth is hollow and so is this promise.",
    "Based on a true story. Unfortunately.",
    "History's most overlooked cult.",
    "Stranger than fiction. Weirder than Florida.",
    // Koreshan philosophy
    "The stars are beneath us.",
    "We are the Victoria Gratia.",
    "The body awaits in the tub.",
    "Cosmogeny is the truth.",
    "The sun is inside the Earth.",
    "Victoria is coming.",
    "The transfer has been foretold.",
    "Emma kept the faith.",
    "Sister Emma tends the vigil.",
    "Gender equality, socialism, and a hollow Earth.",
    "I am Koresh, the shepherd.",
    // Idk
    "They were right about gender equality, at least.",
    "Communists with a corporation.",
    "Concavity, not convexity.",
  ];
  var random = taglines[Math.floor(Math.random() * taglines.length)];

  // Avoid repeating recently shown taglines
  var recentKey = 'recentTaglines';
  var historySize = Math.floor(taglines.length * 2 / 3); // don't repeat until 2/3 seen
  var recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
  var allIndices = taglines.map(function (_, i) { return i; });
  var available = allIndices.filter(function (i) { return recent.indexOf(i) === -1; });
  if (available.length === 0) {
    recent = recent.slice(-3);
    available = allIndices.filter(function (i) { return recent.indexOf(i) === -1; });
  }
  var pickedIndex = available[Math.floor(Math.random() * available.length)];
  recent.push(pickedIndex);
  if (recent.length > historySize) recent.shift();
  localStorage.setItem(recentKey, JSON.stringify(recent));

  $('#tagline').text(taglines[pickedIndex]);
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
