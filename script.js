/* ---------- Theme toggle (light/dark) ---------- */
(function () {
  const root = document.documentElement;
  const stored = (() => { try { return localStorage.getItem("theme"); } catch (_) { return null; } })();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", stored || (prefersDark ? "dark" : "light"));

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (_) {}
  });
})();

/* ---------- Mobile nav ---------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-nav-toggle]");
  if (!btn) return;
  document.querySelector(".nav-links").classList.toggle("mobile-open");
});

/* ---------- Services accordion ---------- */
document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".service-toggle");
  if (!toggle) return;
  const item = toggle.closest(".service-item");
  // Close siblings
  item.parentElement.querySelectorAll(".service-item.open").forEach((sib) => {
    if (sib !== item) sib.classList.remove("open");
  });
  item.classList.toggle("open");
});

/* ---------- Open first service item by default ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const first = document.querySelector(".service-item");
  if (first) first.classList.add("open");
});

/* ---------- Text cursor proximity (letters react to cursor distance) ---------- */
(function () {
  // Skip on touch / reduced-motion
  if (typeof window === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

  const RADIUS = 130;
  const TARGET_LIGHT = [245, 158, 11]; // amber, lerp from burgundy fg toward this
  const TARGET_DARK  = [255, 248, 236]; // warm white, lerp from cream toward this — keeps contrast on dark bg
  let target = TARGET_LIGHT;
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  function syncTarget() { target = isDark() ? TARGET_DARK : TARGET_LIGHT; }
  let mouseX = -9999;
  let mouseY = -9999;
  const letters = [];
  let recalcQueued = false;

  function parseRgb(s) {
    const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : [22, 20, 15];
  }

  function splitText(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (!text.trim()) continue;
        const frag = document.createDocumentFragment();
        for (const ch of text) {
          if (ch === " " || ch === "\n" || ch === "\t" || ch === "\r") {
            frag.appendChild(document.createTextNode(ch));
          } else {
            const span = document.createElement("span");
            span.className = "prox-letter";
            span.textContent = ch;
            frag.appendChild(span);
          }
        }
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitText(child);
      }
    }
  }

  // Strip ALL proximity inline styles so the cascade takes over.
  // We rely on this whenever the theme changes — it guarantees the
  // letters render in the new theme color, no stale state possible.
  function resetLetter(l) {
    l.el.style.color = "";
    l.el.style.transform = "";
    l.el.style.fontWeight = "";
    l.base = null;       // force lazy re-read on next engagement
    l.lastP = 0;
  }

  function recalc() {
    recalcQueued = false;
    for (const l of letters) {
      const r = l.el.getBoundingClientRect();
      l.cx = r.left + r.width / 2;
      l.cy = r.top + r.height / 2;
    }
  }
  function queueRecalc() {
    if (recalcQueued) return;
    recalcQueued = true;
    requestAnimationFrame(recalc);
  }

  function init() {
    const targets = document.querySelectorAll(".text-prox");
    if (!targets.length) return;
    targets.forEach(splitText);
    document.querySelectorAll(".prox-letter").forEach((el) => {
      letters.push({ el, base: null, cx: 0, cy: 0, lastP: 0 });
    });
    syncTarget();
    recalc();
    window.addEventListener("scroll", queueRecalc, { passive: true });
    window.addEventListener("resize", queueRecalc);
    // On theme toggle: swap target color, reset every letter (drops inline
    // styles so the new theme color cascades through), and recompute positions.
    new MutationObserver(() => {
      syncTarget();
      letters.forEach(resetLetter);
      queueRecalc();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    requestAnimationFrame(loop);
  }

  function loop() {
    for (let i = 0; i < letters.length; i++) {
      const l = letters[i];
      const dx = mouseX - l.cx;
      const dy = mouseY - l.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const p = dist >= RADIUS ? 0 : 1 - dist / RADIUS;
      // Cursor far AND letter is at rest → leave the cascade in charge.
      if (p === 0 && l.lastP === 0) continue;
      // Cursor returned to rest → wipe inline styles so cascade takes over.
      if (p === 0) {
        resetLetter(l);
        continue;
      }
      // Cursor engaging this letter — read base color from cascade if we
      // don't have it yet (lazy, theme-correct at the moment of engagement).
      if (l.base === null) {
        l.base = parseRgb(window.getComputedStyle(l.el).color);
      }
      const scale = 1 + p * 0.10;
      const ty = -p * 3;
      const r = Math.round(l.base[0] + (target[0] - l.base[0]) * p);
      const g = Math.round(l.base[1] + (target[1] - l.base[1]) * p);
      const b = Math.round(l.base[2] + (target[2] - l.base[2]) * p);
      l.el.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      l.el.style.color = `rgb(${r}, ${g}, ${b})`;
      l.el.style.fontWeight = String(Math.round(600 + p * 200));
      l.lastP = p;
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
