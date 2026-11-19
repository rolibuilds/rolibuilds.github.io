/* Minimal progressive enhancement. The page is fully readable without this file. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector('[data-theme-toggle]');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : darkQuery.matches;
  }
  function syncToggle() {
    if (toggle) toggle.setAttribute('aria-pressed', String(isDark()));
  }
  if (toggle) {
    toggle.hidden = false;
    syncToggle();
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
      syncToggle();
    });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncToggle);
  }

  /* ---------- Disclosures (button + panel, independent of each other) ---------- */
  var buttons = document.querySelectorAll('.disclosure-btn');
  Array.prototype.forEach.call(buttons, function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', String(btn.getAttribute('aria-expanded') !== 'true'));
    });
  });

  function panelButton(panel) {
    return panel.id ? document.querySelector('.disclosure-btn[aria-controls="' + panel.id + '"]') : null;
  }
  /* Deep links: if the target sits inside a collapsed panel, open it first. */
  function revealTarget() {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id && document.getElementById(id);
    if (!target) return;
    var opened = false;
    var panel = target.closest('.disclosure-panel');
    while (panel) {
      var btn = panelButton(panel);
      if (btn && btn.getAttribute('aria-expanded') !== 'true') {
        panel.classList.add('is-instant');
        btn.setAttribute('aria-expanded', 'true');
        opened = true;
        (function (p) { setTimeout(function () { p.classList.remove('is-instant'); }, 50); })(panel);
      }
      panel = panel.parentElement && panel.parentElement.closest('.disclosure-panel');
    }
    if (opened) target.scrollIntoView();
  }
  revealTarget();
  window.addEventListener('hashchange', revealTarget);

  /* ---------- Language switch keeps the visitor on the same section ---------- */
  var langLink = document.querySelector('.lang-switch');
  if (langLink) {
    var langBase = langLink.getAttribute('href');
    var syncLang = function () { langLink.setAttribute('href', langBase + location.hash); };
    syncLang();
    window.addEventListener('hashchange', syncLang);
  }

  /* ---------- Reveal: once-only fade/rise for [data-reveal] (styles in CSS) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    function disarm() { root.classList.remove('reveal-ready'); }
    if (!items.length || !('IntersectionObserver' in window) || reduceMotion.matches) { disarm(); return; }
    root.classList.add('reveal-ready');
    root.setAttribute('data-reveal-booted', '');
    var STAGGER = 80, MAX_STEPS = 5;
    function reveal(entries, io) {
      /* Elements entering together are staggered in document order */
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i, MAX_STEPS) * STAGGER + 'ms';
        el.classList.add('is-revealed');
        io.unobserve(el);
      });
    }
    /* Hero items reveal as soon as any part is visible; the rest wait until slightly inside the viewport */
    var ioHero = new IntersectionObserver(reveal, { rootMargin: '0px' });
    var io = new IntersectionObserver(reveal, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) { (el.closest('.hero') ? ioHero : io).observe(el); });
    /* If the visitor switches reduced motion on later, show everything at once */
    var onChange = function () { if (reduceMotion.matches) { io.disconnect(); ioHero.disconnect(); disarm(); } };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onChange);
  }
  initReveal();

  /* ---------- Hero fills the first viewport: measure the real header height ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var setHeaderH = function () { root.style.setProperty('--header-h', header.getBoundingClientRect().height + 'px'); };
    setHeaderH();
    if ('ResizeObserver' in window) new ResizeObserver(setHeaderH).observe(header);
    else window.addEventListener('resize', setHeaderH);
  }

  /* ---------- Sticky header: subtle bottom border once the page has scrolled ---------- */
  if (header) {
    var syncScrolled = function () { header.classList.toggle('is-scrolled', (window.pageYOffset || root.scrollTop) > 4); };
    syncScrolled();
    window.addEventListener('scroll', syncScrolled, { passive: true });
  }

  /* ---------- Career tone: follows the employer chapter that dominates the viewport, in both scroll directions ---------- */
  var career = document.getElementById('career');
  var employers = career ? career.querySelectorAll('[data-employer]') : [];
  if (employers.length) {
    var toneTicking = false;
    var syncTone = function () {
      toneTicking = false;
      /* Dominant chapter = the one closest to a reading line 40% down the viewport */
      var line = window.innerHeight * 0.4, best = null, bestDist = Infinity;
      Array.prototype.forEach.call(employers, function (el) {
        var r = el.getBoundingClientRect();
        var dist = line < r.top ? r.top - line : (line > r.bottom ? line - r.bottom : 0);
        if (dist < bestDist) { bestDist = dist; best = el; }
      });
      if (best && career.getAttribute('data-tone') !== best.getAttribute('data-employer')) {
        career.setAttribute('data-tone', best.getAttribute('data-employer'));
      }
    };
    syncTone();
    window.addEventListener('scroll', function () {
      if (!toneTicking) { toneTicking = true; requestAnimationFrame(syncTone); }
    }, { passive: true });
    window.addEventListener('resize', syncTone);
  }

  /* ---------- Motion-only enhancements (skipped for reduced motion) ---------- */
  function enhanceMotion() {
    if (reduceMotion.matches) return;

    /* Scroll-linked progress for the Automation Journey (passive listener, native scrolling untouched) */
    var journey = document.querySelector('[data-journey]');
    if (journey) {
      var stages = journey.querySelectorAll('[data-stage]');
      var ticking = false;
      var update = function () {
        ticking = false;
        var rect = journey.getBoundingClientRect();
        var mid = window.innerHeight * 0.55;
        var p = Math.max(0, Math.min(1, (mid - rect.top) / rect.height));
        journey.style.setProperty('--journey-progress', p.toFixed(3));
        Array.prototype.forEach.call(stages, function (s) {
          s.classList.toggle('is-reached', s.getBoundingClientRect().top < mid);
        });
      };
      journey.classList.add('is-live');
      update();
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      window.addEventListener('resize', update);
    }
  }
  enhanceMotion();
})();
