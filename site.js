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

    // Always-visible sticky nav (no hide-on-scroll). Keep it pinned; the
    // shadow above signals it's floating once you leave the top.
    nav.classList.remove('nav-hidden');
    lastY = y;
  }, { passive: true });
})();

/* ---------------------------------------------------------
   Marquee auto-fill — guarantees a seamless, gap-free endless
   loop on ANY screen width. The CSS keyframe slides the track
   by -50%, so the track must be an even number of identical
   units and at least 2x the container width. We treat each
   marquee's authored content as one unit and duplicate it
   (always an even count) until it comfortably overflows.
   --------------------------------------------------------- */
(function () {
  var marquees = document.querySelectorAll('.marquee');
  if (!marquees.length) return;

  function fill(m) {
    var track = m.querySelector('.track');
    if (!track) return;
    if (!track.dataset.unit) track.dataset.unit = track.innerHTML;
    var unit = track.dataset.unit;
    // start with two units (keeps the -50% seam perfect)
    track.innerHTML = unit + unit;
    var guard = 0;
    // grow (two units at a time) until the track is >= 2x the visible width
    while (track.scrollWidth < m.clientWidth * 2 + 40 && guard < 12) {
      track.innerHTML += unit + unit;
      guard++;
    }
  }

  function fillAll() { Array.prototype.forEach.call(marquees, fill); }

  fillAll();
  // refit once fonts settle (glyph widths change the measurement)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillAll);
  window.addEventListener('load', fillAll);

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(fillAll, 180);
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
