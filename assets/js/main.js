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
    var storyFull = target.closest('.story__full');
    if (storyFull) {
      var sb = document.querySelector('.story__btn[aria-controls="' + storyFull.id + '"]');
      if (sb && sb.getAttribute('aria-expanded') !== 'true') sb.click();
    }
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

  /* ---------- Story disclosures (accordion) ----------
     Idle states use natural height (nothing can be clipped). While opening or closing, the stage
     animates between two measured heights; CSS handles the fades. */
  var mobileMq = window.matchMedia('(max-width: 40rem), (pointer: coarse) and (max-width: 85.4rem)');
  var pendingRepos = null;
  var pageCtxEl = null;
  function ctxBarHeight() { return pageCtxEl && pageCtxEl.classList.contains('is-visible') ? pageCtxEl.offsetHeight : 0; }
  function headerHeight() { var h = document.querySelector('.site-header'); return h ? h.getBoundingClientRect().height : 0; }
  ['wheel', 'touchstart', 'keydown'].forEach(function (t) {
    window.addEventListener(t, function () { pendingRepos = null; }, { passive: true });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-story]'), function (story) {
    var stage = story.querySelector('.story__stage');
    var teaser = story.querySelector('.story__teaser');
    var full = story.querySelector('.story__full');
    var btn = full && story.querySelector('.story__btn[aria-controls="' + full.id + '"]');
    var label = btn && btn.querySelector('[data-story-label]');
    if (!stage || !full || !btn) return;
    var isOpen = false, timer = 0, repos = null;
    var stageItem = story.closest('.stage') || story.closest('.reporting');
    story.setAttribute('data-state', 'closed');
    btn.hidden = false;
    function finish() {
      clearTimeout(timer);
      story.setAttribute('data-state', isOpen ? 'open' : 'closed');
      stage.style.height = '';
      stage.removeEventListener('transitionend', onEnd);
      /* Mobile: after SHOW LESS has fully collapsed, bring the block top back below the header and context bar only if it was left above them. */
      if (!isOpen && repos && repos === pendingRepos && stageItem && mobileMq.matches) {
        pendingRepos = null;
        var offset = headerHeight() + ctxBarHeight();
        var top = stageItem.getBoundingClientRect().top;
        if (top < offset - 2) {
          window.scrollTo({ top: top + window.pageYOffset - offset - 16, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
        }
      }
      repos = null;
    }
    function onEnd(ev) { if (ev.target === stage && ev.propertyName === 'height') finish(); }
    btn.addEventListener('click', function () {
      isOpen = !isOpen;
      repos = null; pendingRepos = null;
      if (!isOpen && stageItem) { repos = {}; pendingRepos = repos; }
      btn.setAttribute('aria-expanded', String(isOpen));
      if (label) label.textContent = btn.getAttribute(isOpen ? 'data-label-open' : 'data-label-closed');
      if (reduceMotion.matches) {
        story.classList.toggle('is-open', isOpen);
        finish();
        return;
      }
      var from = stage.offsetHeight;
      clearTimeout(timer);
      stage.style.height = from + 'px';
      story.setAttribute('data-state', isOpen ? 'opening' : 'closing');
      story.classList.toggle('is-open', isOpen);
      var target = isOpen ? full.offsetHeight : (teaser ? teaser.offsetHeight : 0);
      void stage.offsetHeight;
      stage.style.height = target + 'px';
      stage.addEventListener('transitionend', onEnd);
      timer = setTimeout(finish, 900);
    });
  });

  /* ---------- Capability cards: every collapsed card gets the tallest collapsed height; open cards grow alone ---------- */
  var cardGrid = document.querySelector('.card-grid');
  if (cardGrid) {
    var cards = cardGrid.querySelectorAll('.proof-card');
    var equalise = function () {
      var cols = getComputedStyle(cardGrid).gridTemplateColumns.split(' ').length;
      Array.prototype.forEach.call(cards, function (c) { c.style.minHeight = ''; });
      if (cols < 2) return;
      var max = 0;
      Array.prototype.forEach.call(cards, function (c) {
        var panel = c.querySelector('.disclosure-panel');
        var h = c.offsetHeight - (panel ? panel.offsetHeight : 0);
        if (h > max) max = h;
      });
      Array.prototype.forEach.call(cards, function (c) { c.style.minHeight = max + 'px'; });
    };
    var queue = 0;
    var schedule = function () { cancelAnimationFrame(queue); queue = requestAnimationFrame(equalise); };
    equalise();
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(cardGrid);
    else window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  }

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

  /* ---------- Journey timeline ends at the final endpoint node ---------- */
  var journeyEl = document.querySelector('[data-journey]');
  var endStage = journeyEl && journeyEl.querySelector('.stage--end');
  if (endStage) {
    var setJourneyEnd = function () {
      journeyEl.style.setProperty('--journey-end', Math.max(0, endStage.offsetHeight - 0.9 * parseFloat(getComputedStyle(document.documentElement).fontSize)) + 'px');
    };
    setJourneyEnd();
    window.addEventListener('resize', setJourneyEnd);
    window.addEventListener('load', setJourneyEnd);
  }

  /* ---------- Mobile page context bar: one sticky, aria-hidden bar (primary + secondary title) derived from existing headings ---------- */
  var mainEl = document.getElementById('main');
  var careerEl = document.getElementById('career');
  if (mainEl && careerEl) {
    var txt = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
    var q = function (sel, root) { return (root || document).querySelector(sel); };
    var zones = [];
    var add = function (el, tone, kind, primary, secondary, card, cap) { if (el) zones.push({ el: el, tone: tone, kind: kind, primary: primary, secondary: secondary, card: card, cap: cap }); };
    var capTitle = txt(q('#capabilities-title'));
    var capCards = document.querySelectorAll('#capabilities .proof-card');
    add(q('#capabilities'), 'default', '', capTitle, txt(q('.card__title', capCards[0])), false, true);
    Array.prototype.forEach.call(capCards, function (c) { add(c, 'default', '', capTitle, txt(q('.card__title', c)), true, true); });
    var builtTitle = txt(q('#built-title'));
    add(q('#built'), 'default', '', builtTitle, txt(q('.subhead', q('#building'))));
    add(q('#building'), 'default', '', builtTitle, txt(q('.subhead', q('#building'))));
    add(q('#built-journey'), 'default', '', builtTitle, txt(q('.subhead', q('#built-journey'))));
    add(q('#built-csap'), 'default', '', txt(q('#csap-title')), txt(q('.csap__eyebrow', q('#built-csap'))));
    add(q('#built-portfolio'), 'default', '', txt(q('#portfolio-title')), txt(q('.csap__eyebrow', q('#built-portfolio'))));
    add(careerEl, '', 'hidden');
    var employerEls = careerEl.querySelectorAll('.employer');
    Array.prototype.forEach.call(employerEls, function (em) { add(em, em.getAttribute('data-employer'), 'career'); });
    var aboutTitle = txt(q('#about-title'));
    add(q('.about-open'), 'about', '', aboutTitle, '');
    Array.prototype.forEach.call(document.querySelectorAll('#about .about-ch'), function (ch) {
      add(ch, ch.id.replace('about-', ''), '', aboutTitle, txt(q('.about-ch__label', ch)));
    });
    add(q('#contact'), '', 'hidden');

    var ctx = document.createElement('div');
    ctx.className = 'page-ctx';
    ctx.setAttribute('aria-hidden', 'true');
    ctx.innerHTML = '<span class="page-ctx__primary"></span><span class="page-ctx__secondary"></span>';
    var ctxP = ctx.firstChild, ctxS = ctx.lastChild;
    mainEl.insertBefore(ctx, mainEl.firstChild);
    pageCtxEl = ctx;
    var ctxTicking = false, lastKey = '';
    var setCtx = function (tone, kind, primary, secondary) {
      var key = [tone, kind, primary, secondary].join('|');
      if (key === lastKey) return;
      lastKey = key;
      ctx.setAttribute('data-tone', tone);
      if (kind) ctx.setAttribute('data-kind', kind); else ctx.removeAttribute('data-kind');
      ctxP.textContent = primary;
      ctxP.classList.toggle('is-long', primary.length > 28 && kind !== 'career');
      ctxS.textContent = secondary;
      ctxS.hidden = !secondary;
    };
    var ctxUpdate = function () {
      ctxTicking = false;
      if (!mobileMq.matches) { ctx.classList.remove('is-visible'); return; }
      /* zones are in document order, so the last one above the reading line is current */
      var line = headerHeight() + ctx.offsetHeight + 8, cur = null, curTop = 0;
      for (var i = 0; i < zones.length; i++) {
        /* Contact releases the bar as soon as it is well into view */
        var at = zones[i].el.id === 'contact' ? Math.max(line, window.innerHeight * 0.7) : line;
        var zt = zones[i].el.getBoundingClientRect().top;
        /* cards in the same grid row share a top: the first (leftmost) one stays current */
        if (zt <= at && !(zones[i].card && cur && cur.card && Math.abs(zt - curTop) < 2)) { cur = zones[i]; curTop = zt; }
      }
      if (!cur || cur.kind === 'hidden') { ctx.classList.remove('is-visible'); return; }
      if (cur.kind === 'career') {
        var em = cur.el, roles = em.querySelectorAll('.role'), roleEl;
        if (roles.length) {
          roleEl = roles[0];
          Array.prototype.forEach.call(roles, function (r) { if (r.getBoundingClientRect().top <= line) roleEl = r; });
          roleEl = roleEl.querySelector('h4');
        } else {
          roleEl = em.querySelector('.progression .is-latest');
        }
        setCtx(cur.tone, 'career', txt(em.querySelector('.employer__name')), txt(roleEl));
      } else {
        /* With a multi-column Capabilities grid no single card is current: show the primary line only */
        var cols = cur.cap ? getComputedStyle(q('.card-grid')).gridTemplateColumns.split(' ').length : 1;
        setCtx(cur.tone, '', cur.primary, cols > 1 ? '' : cur.secondary);
      }
      ctx.classList.add('is-visible');
    };
    var ctxQueue = function () { if (!ctxTicking) { ctxTicking = true; requestAnimationFrame(ctxUpdate); } };
    window.addEventListener('scroll', ctxQueue, { passive: true });
    window.addEventListener('resize', ctxQueue);
    window.addEventListener('orientationchange', ctxQueue);
    mobileMq.addEventListener('change', ctxQueue);
    ctxUpdate();
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
