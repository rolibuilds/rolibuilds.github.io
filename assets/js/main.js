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

  /* ---------- Motion-only enhancements (skipped for reduced motion) ---------- */
  function enhanceMotion() {
    if (reduceMotion.matches) return;

    /* Subtle section reveals */
    if ('IntersectionObserver' in window) {
      var items = document.querySelectorAll('.reveal');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      root.classList.add('reveal-ready');
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    }

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
