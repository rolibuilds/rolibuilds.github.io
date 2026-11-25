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

  /* ---------- Collapsible navigation (one nav, one state; inline at >= 64rem) ---------- */
  var navBtn = document.querySelector('[data-nav-toggle]');
  var siteNav = document.querySelector('[data-site-nav]');
  var siteHeader = document.querySelector('.site-header');
  if (navBtn && siteNav && siteHeader) {
    var inlineMq = window.matchMedia('(min-width: 64rem)');
    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    siteHeader.appendChild(backdrop);
    navBtn.hidden = false;
    /* The dropdown does not lock the page: once the document itself has moved more than a few
       pixels from where it was when the menu opened, the menu closes. Scroll events fire only for
       real document movement (not menu focus, browser-chrome resizes or touch jitter). The
       listener exists only while the menu is open. */
    var menuScrollY = 0;
    var menuRebase = false;
    var menuRebaseTimer = 0;
    var onMenuScroll = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (menuRebase) { menuScrollY = y; return; }
      if (Math.abs(y - menuScrollY) > 10) setMenu(false, false);
    };
    /* A resize or rotation can shift the document without the visitor scrolling: re-base instead of closing. */
    var onMenuResize = function () {
      menuRebase = true;
      clearTimeout(menuRebaseTimer);
      menuRebaseTimer = setTimeout(function () {
        menuRebase = false;
        menuScrollY = window.pageYOffset || document.documentElement.scrollTop;
      }, 200);
    };
    var setMenu = function (open, returnFocus) {
      var wasOpen = siteHeader.classList.contains('is-menu-open');
      if (open && !wasOpen) {
        menuScrollY = window.pageYOffset || document.documentElement.scrollTop;
        window.addEventListener('scroll', onMenuScroll, { passive: true });
        window.addEventListener('resize', onMenuResize);
      } else if (!open && wasOpen) {
        window.removeEventListener('scroll', onMenuScroll);
        window.removeEventListener('resize', onMenuResize);
        menuRebase = false;
        clearTimeout(menuRebaseTimer);
        if (typeof clearTap === 'function') clearTap();
      }
      siteHeader.classList.toggle('is-menu-open', open);
      navBtn.setAttribute('aria-expanded', String(open));
      navBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (!open && returnFocus) navBtn.focus();
    };
    navBtn.addEventListener('click', function (e) {
      var opening = !siteHeader.classList.contains('is-menu-open');
      setMenu(opening, false);
      /* Keyboard activation (Enter or Space) has click detail 0; a mouse or touch click has detail >= 1.
         Only keyboard users get focus moved to the first link, so Tab continues through the menu in order.
         The links precede the trigger in the document, so without this Tab would skip them. */
      if (opening && e.detail === 0) {
        var first = siteNav.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    });
    siteNav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setMenu(false, false);
    });
    /* Backdrop: a tap closes the menu. With pointer events, a tap is a gesture that starts and ends on the
       backdrop, moves less than BACKDROP_TAP_SLOP CSS px, is not cancelled (the browser cancels the pointer
       when it takes over to pan the page) and leaves the document where it was. Drags are left to the
       browser and to the scroll-dismiss above; default actions are never prevented. */
    var BACKDROP_TAP_SLOP = 7;
    var tap = null;
    var clearTap = function () { tap = null; };
    var docY = function () { return window.pageYOffset || document.documentElement.scrollTop; };
    if (window.PointerEvent) {
      backdrop.addEventListener('pointerdown', function (e) {
        if (e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
        tap = { id: e.pointerId, x: e.clientX, y: e.clientY, sy: docY() };
      });
      backdrop.addEventListener('pointermove', function (e) {
        if (!tap || e.pointerId !== tap.id) return;
        if (Math.abs(e.clientX - tap.x) > BACKDROP_TAP_SLOP || Math.abs(e.clientY - tap.y) > BACKDROP_TAP_SLOP) tap = null;
      });
      backdrop.addEventListener('pointerup', function (e) {
        var t = tap;
        tap = null;
        if (!t || e.pointerId !== t.id || e.target !== backdrop) return;
        if (Math.abs(e.clientX - t.x) > BACKDROP_TAP_SLOP || Math.abs(e.clientY - t.y) > BACKDROP_TAP_SLOP) return;
        if (Math.abs(docY() - t.sy) > 2) return;
        setMenu(false, false);
      });
      backdrop.addEventListener('pointercancel', clearTap);
      window.addEventListener('orientationchange', clearTap);
    } else {
      backdrop.addEventListener('click', function () { setMenu(false, false); });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !siteHeader.classList.contains('is-menu-open')) return;
      var inside = siteNav.contains(document.activeElement) || document.activeElement === navBtn;
      setMenu(false, inside);
    });
    var onInlineChange = function () { if (inlineMq.matches) setMenu(false, false); };
    if (inlineMq.addEventListener) inlineMq.addEventListener('change', onInlineChange);
    else if (inlineMq.addListener) inlineMq.addListener(onInlineChange);
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

  /* ---------- Automation rows: once-only fade/rise at 15% visibility, staggered when several enter together ---------- */
  (function () {
    var rows = document.querySelectorAll('[data-autoreveal]');
    if (!rows.length) return;
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(rows, function (r) { r.classList.add('is-in'); }); return; }
    /* reduced motion: the same once-only reveal, but as a plain opacity fade (CSS removes the movement) */
    if (reduceMotion.matches) rows[0].parentNode.classList.add('is-fade');
    var rio = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.transitionDelay = i * 80 + 'ms';
        el.classList.add('is-in');
        rio.unobserve(el);
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(rows, function (r) { rio.observe(r); });
  })();

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

  /* ---------- Mobile page context bar: one sticky, aria-hidden bar (primary + secondary title) derived from existing headings ---------- */
  var mainEl = document.getElementById('main');
  var careerEl = document.getElementById('career');
  if (mainEl && careerEl) {
    var txt = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
    var q = function (sel, root) { return (root || document).querySelector(sel); };
    var zones = [];
    var add = function (el, tone, kind, primary, secondary, card, cap) { if (el) zones.push({ el: el, tone: tone, kind: kind, primary: primary, secondary: secondary, card: card, cap: cap }); };
    /* Zones are keyed to each section's heading: the bar changes when that heading reaches the bottom of the fixed header.
       Experience shows one line; each career station shows CAREER with the employer name below; hidden in Beyond work and Contact. */
    add(q('#career-title'), 'otp', '', 'Experience', '');
    Array.prototype.forEach.call(careerEl.querySelectorAll('.employer'), function (em) {
      var nm = em.querySelector('.employer__name');
      add(nm, 'otp', 'career', 'Career', txt(nm));
    });
    add(q('#built-title'), 'default', '', 'Automation', '');
    add(q('#csap-title'), 'default', '', 'Project', '');
    add(q('#recommendations .eyebrow'), 'default', '', 'Recommendations', '');
    add(q('#outside-work'), '', 'hidden');
    add(q('#contact-title'), '', 'hidden');

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
      /* zones are in document order, so the last heading at or above the bottom edge of the fixed header is current */
      var line = headerHeight() + (ctx.classList.contains('is-visible') ? ctx.offsetHeight : 0) + 1, cur = null;
      /* At the very end of the page the last short sections can never scroll up to the header: a visible hidden-zone heading then releases the bar */
      /* Beyond work releases the bar at the section's top border (the grey line under the recommendations note), always measured at the bar's bottom edge so it is symmetric when scrolling back */
      var hideLine = headerHeight() + ctx.offsetHeight + 1;
      var atPageEnd = (window.pageYOffset || document.documentElement.scrollTop) + window.innerHeight >= document.documentElement.scrollHeight - 2;
      for (var i = 0; i < zones.length; i++) {
        var zt = zones[i].el.getBoundingClientRect().top;
        if (zt <= (zones[i].kind === 'hidden' ? hideLine : line) || (atPageEnd && zones[i].kind === 'hidden' && zt < window.innerHeight)) cur = zones[i];
      }
      if (!cur || cur.kind === 'hidden') { ctx.classList.remove('is-visible'); return; }
      setCtx(cur.tone, cur.kind, cur.primary, cur.secondary);
      ctx.classList.add('is-visible');
    };
    var ctxQueue = function () { if (!ctxTicking) { ctxTicking = true; requestAnimationFrame(ctxUpdate); } };
    window.addEventListener('scroll', ctxQueue, { passive: true });
    window.addEventListener('resize', ctxQueue);
    window.addEventListener('orientationchange', ctxQueue);
    mobileMq.addEventListener('change', ctxQueue);
    ctxUpdate();
  }

  /* ---------- Automation Journey progress rail (all viewports, one shared calculation) ----------
     Decorative scroll-position feedback: the dark rail runs from the top of the timeline to the centre of the
     endpoint node and reflects where a reading line sits inside that span (clamped 0-1, so it retracts on scroll up).
     It is positioned from rendered geometry, so disclosures, fonts, images, rotation and resizing all recalculate it.
     No timers or easing: native scrolling is untouched and reduced motion simply gets the same static position. */
  var journey = document.querySelector('[data-journey]');
  if (journey) {
    var jStages = journey.querySelectorAll('[data-stage]');
    var jEnd = journey.querySelector('.stage--end') || jStages[jStages.length - 1]; /* the rail ends at the node of the last step */
    var jTicking = false, jListening = false, jEndRail = -1;
    var jUpdate = function () {
      jTicking = false;
      var rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      var endRail = Math.max(0, (jEnd ? jEnd.offsetHeight - 0.9 * rem : 0.75 * rem));
      if (endRail !== jEndRail) { jEndRail = endRail; journey.style.setProperty('--journey-end', endRail + 'px'); }
      var rect = journey.getBoundingClientRect();
      /* reading line: 55% of the visible area below the fixed header and (when shown) the context bar */
      var offset = headerHeight() + ctxBarHeight();
      var line = offset + (window.innerHeight - offset) * 0.55;
      var railTop = rect.top + 0.75 * rem, railLen = rect.height - 0.75 * rem - endRail;
      var p = railLen > 0 ? (line - railTop) / railLen : 0;
      p = p > 0 ? (p < 1 ? p : 1) : 0; /* also maps NaN to 0 */
      journey.style.setProperty('--journey-progress', p.toFixed(4));
      Array.prototype.forEach.call(jStages, function (st) {
        st.classList.toggle('is-reached', st.getBoundingClientRect().top < line);
      });
      /* the endpoint node follows the same rule: filled only while the reading line is past its top, like the numbered nodes */
      if (jEnd) jEnd.classList.toggle('is-reached', jEnd.getBoundingClientRect().top < line);
    };
    var jQueue = function () { if (!jTicking) { jTicking = true; requestAnimationFrame(jUpdate); } };
    var jListen = function (on) {
      if (on === jListening) return;
      jListening = on;
      window[on ? 'addEventListener' : 'removeEventListener']('scroll', jQueue, { passive: true });
    };
    journey.classList.add('is-live');
    jUpdate();
    /* scroll work only while the Journey is within about one screen of the viewport; a final update clamps the rail when it leaves */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        jListen(entries[entries.length - 1].isIntersecting);
        jQueue();
      }, { rootMargin: '100% 0px 100% 0px' }).observe(journey);
    } else {
      jListen(true);
    }
    /* layout changes without scrolling: disclosures, fonts, images, rotation, resizing */
    if ('ResizeObserver' in window) {
      var jRo = new ResizeObserver(jQueue);
      jRo.observe(journey);
      if (jEnd) jRo.observe(jEnd);
    }
    window.addEventListener('resize', jQueue);
    window.addEventListener('orientationchange', jQueue);
    window.addEventListener('load', jQueue);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jQueue);
  }
  /* ---------- Image modal: one native <dialog>, built only when JavaScript and showModal() exist ---------- */
  (function () {
    var frames = document.querySelectorAll('[data-enlarge]');
    var probe = document.createElement('dialog');
    if (!frames.length || typeof probe.showModal !== 'function') return;
    var dlg = document.createElement('dialog');
    dlg.className = 'img-modal';
    var panel = document.createElement('div');
    panel.className = 'img-modal__panel';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'img-modal__close';
    close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close enlarged image');
    var big = document.createElement('img');
    big.className = 'img-modal__img';
    big.alt = '';
    big.draggable = false;
    panel.appendChild(close);
    panel.appendChild(big);
    dlg.appendChild(panel);
    document.body.appendChild(dlg);
    var opener = null;
    function shut() { if (dlg.open) dlg.close(); }
    close.addEventListener('click', shut);
    /* backdrop: a click whose target is the dialog itself (outside the panel) */
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === panel) shut(); });
    dlg.addEventListener('close', function () {
      if (opener) { opener.focus({ preventScroll: true }); opener = null; }
    });
    dlg.addEventListener('contextmenu', function (e) { if (e.target === big) e.preventDefault(); });
    Array.prototype.forEach.call(frames, function (frame) {
      var img = frame.querySelector('img');
      if (!img) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'proof__btn';
      btn.setAttribute('aria-haspopup', 'dialog');
      frame.insertBefore(btn, img);
      btn.appendChild(img);
      var hint = document.createElement('span');
      hint.className = 'sr-only';
      hint.textContent = ' (opens enlarged image dialog)';
      btn.appendChild(hint);
      img.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () {
        opener = btn;
        big.src = img.currentSrc || img.src;
        dlg.setAttribute('aria-label', img.alt);
        dlg.showModal();
        close.focus({ preventScroll: true });
      });
    });
  })();
  /* ---------- CSAP demo: poster thumbnail opens a native <dialog> with the (silent) video. Without JavaScript the link opens the file. ---------- */
  (function () {
    var link = document.querySelector('[data-demo]');
    var probe = document.createElement('dialog');
    if (!link || typeof probe.showModal !== 'function') return;
    var file = link.getAttribute('href');
    var label = 'CSAP demo video with fictional data';
    var dlg = document.createElement('dialog');
    dlg.className = 'img-modal img-modal--video';
    dlg.setAttribute('aria-label', label);
    var panel = document.createElement('div');
    panel.className = 'img-modal__panel';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'img-modal__close';
    close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close video');
    var vid = document.createElement('video');
    vid.className = 'img-modal__video';
    vid.controls = true;
    vid.muted = true;
    vid.setAttribute('muted', '');
    vid.setAttribute('playsinline', '');
    vid.preload = 'none';
    vid.setAttribute('aria-label', label);
    var poster = link.querySelector('img');
    if (poster) vid.poster = poster.getAttribute('src');
    panel.appendChild(close);
    panel.appendChild(vid);
    dlg.appendChild(panel);
    document.body.appendChild(dlg);
    var loaded = false;
    function shut() { if (dlg.open) dlg.close(); }
    close.addEventListener('click', shut);
    /* backdrop: a click on the dialog itself or its empty panel area (not on the video) */
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === panel) shut(); });
    /* scrolling outside the video closes it (the video itself keeps its native controls and wheel behaviour) */
    function scrolled(e) { if (e.target !== vid) shut(); }
    dlg.addEventListener('wheel', scrolled, { passive: true });
    dlg.addEventListener('touchmove', scrolled, { passive: true });
    dlg.addEventListener('close', function () {
      vid.pause();
      try { vid.currentTime = 0; } catch (err) { /* not loaded yet */ }
      link.focus({ preventScroll: true });
    });
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-label', 'Play ' + label + ' (opens video dialog)');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (!loaded) { loaded = true; vid.src = file; }
      dlg.showModal();
      close.focus({ preventScroll: true });
      var p = vid.play();
      if (p && p.catch) p.catch(function () {});
    });
  })();
})();
