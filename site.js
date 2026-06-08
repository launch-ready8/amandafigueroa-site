/* =========================================================
   Amanda Figueroa — shared site behavior
   Smart nav: hides when scrolling down, reappears on scroll up.
   Runs the handler directly (no rAF) so it works reliably
   even in throttled/inactive frames.
   ========================================================= */
(function () {
  var nav = document.querySelector('.site-nav');
  if (!nav) return;

  var lastY = window.pageYOffset || 0;
  var threshold = 90;   // don't hide until we're past the nav itself
  var delta = 6;        // ignore tiny jitters

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || 0;

    // subtle shadow once we leave the very top
    if (y > 4) nav.classList.add('nav-stuck');
    else nav.classList.remove('nav-stuck');

    if (Math.abs(y - lastY) < delta) return;

    if (y > lastY && y > threshold) {
      nav.classList.add('nav-hidden');     // scrolling down
    } else {
      nav.classList.remove('nav-hidden');  // scrolling up
    }
    lastY = y;
  }, { passive: true });
})();

/* ---------------------------------------------------------
   Mobile hamburger menu — builds a full-screen overlay from
   the existing nav links so every page gets it for free.
   --------------------------------------------------------- */
(function () {
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var links = nav.querySelector('.links');
  if (!links || nav.querySelector('.nav-toggle')) return;

  var toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(toggle);

  var menu = document.createElement('div');
  menu.className = 'nav-menu';
  var close = document.createElement('button');
  close.className = 'nav-close';
  close.setAttribute('aria-label', 'Close menu');
  close.innerHTML = '&times;';
  menu.appendChild(close);
  Array.prototype.forEach.call(links.children, function (a) {
    menu.appendChild(a.cloneNode(true));
  });
  document.body.appendChild(menu);

  function shut() { document.body.classList.remove('nav-open'); }
  toggle.addEventListener('click', function () { document.body.classList.add('nav-open'); });
  close.addEventListener('click', shut);
  Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
    a.addEventListener('click', shut);
  });
})();
