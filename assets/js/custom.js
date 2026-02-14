// Faster fade-in for returning visitors, slower for first-timers
if (localStorage.getItem('visited')) {
  document.documentElement.classList.add('returning-visitor');
} else {
  localStorage.setItem('visited', 'true');
}

// Random tagline
$(document).ready(function () {
  var taglines = [
    "Hollow World!",
    "We live inside!",
    "Come and be healed!",
    "Salvation is upon us.",
    "A New Jerusalem awaits.",
    "Immortality through unity.",
    "Celibate, socialist, immortal."
  ];
  var random = taglines[Math.floor(Math.random() * taglines.length)];
  $('#tagline').text(random);
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
