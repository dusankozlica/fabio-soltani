/* =========================================================
   FABIO SOLTANI — interactions
   ========================================================= */
(function () {
  'use strict';

  /* === CONFIG — bei Bedarf anpassen ============================ */
  var BOOKING_PHONE = '+41 44 382 17 69';
  var BOOKING_EMAIL = 'info@fabiosoltani.ch';   // TODO: echte Empfangsadresse bestätigen
  var OPEN_HOUR = 8, CLOSE_HOUR = 18;           // Mo–Fr 08–18 Uhr
  var WORKDAYS = [1, 2, 3, 4, 5];               // Mo–Fr (0=So)
  // Optional: echte Atelier-Videos. Pfad eintragen, sobald Footage vorhanden ist –
  // dann spielt das Video automatisch, sonst bleibt die animierte Bild-Sektion (kein 404).
  var VIDEOS = { hero: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GmVWMu8qfChuhpbZAAwbcBzJN9/8e9b34f7-436e-4ced-af44-23b14359ae85.mp4', philosophie: 'assets/video/philosophie.mp4' };  // leeren ('') = nur animiertes Foto
  /* ============================================================ */

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;   // smooth-scroll instance (set once Lenis loads)

  document.addEventListener('DOMContentLoaded', function () {
    setYear();
    smoothScroll();
    header();
    activeNav();
    mobileMenu();
    anchorScroll();
    reveal();
    trustReveal();
    counters();
    videoFallback();
    serviceClips();
    beforeAfter();
    booking();
    heritageFit();
  });

  /* ---------- smooth momentum scrolling (Lenis) ----------
     Loaded dynamically so the page still works if the CDN is blocked; on
     reduced-motion we skip it entirely and keep native scrolling. */
  function smoothScroll() {
    if (reduce) return;
    var css = 'html.lenis,html.lenis body{height:auto}'
      + '.lenis.lenis-smooth{scroll-behavior:auto!important}'
      + '.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}'
      + '.lenis.lenis-stopped{overflow:hidden}';
    var st = document.createElement('style'); st.textContent = css;
    document.head.appendChild(st);
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.19/dist/lenis.min.js';
    s.onload = function () {
      if (!window.Lenis) return;
      document.documentElement.style.scrollBehavior = 'auto';
      lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, touchMultiplier: 1.6 });
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    };
    s.onerror = function () { lenis = null; };   // fall back to native scroll
    document.head.appendChild(s);
  }

  /* ---------- heritage panorama: scale the fixed stage to fit the framed panel ---------- */
  function heritageFit() {
    var frame = $('.ch-scroller');
    var stage = $('.ch-stage');
    if (!frame || !stage) return;
    var DESIGN_W = 1900;
    var apply = function () {
      if (window.innerWidth <= 1024) {
        stage.style.transform = '';
        frame.style.height = '';
        frame.classList.remove('is-fit');
        return;
      }
      frame.classList.add('is-fit');
      stage.style.transform = '';            // measure unscaled
      var s = frame.clientWidth / DESIGN_W;
      stage.style.transform = 'scale(' + s + ')';
      frame.style.height = Math.round(stage.offsetHeight * s) + 'px';
    };
    apply();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(apply, 120); }, { passive: true });
    window.addEventListener('load', apply);
  }

  /* ---------- year ---------- */
  function setYear() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- sticky header ---------- */
  function header() {
    var h = $('.site-header');
    if (!h) return;
    // Aktionsleiste unten erscheint, sobald der Hero-CTA aus dem Bild ist
    var bar = $('#mobileBar');
    var onScroll = function () {
      h.classList.toggle('scrolled', window.scrollY > 24);
      if (bar) bar.classList.toggle('is-on', window.scrollY > window.innerHeight * .55);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- reliable in-page anchor scrolling ----------
     Native/CSS `scroll-behavior:smooth` anchor jumps are unreliable on this
     page (long-distance smooth scrolls get cancelled, so nav links appeared
     to do nothing). We drive the scroll ourselves with a rAF easing loop that
     uses instant per-frame scrolls — which always works — and keep the smooth
     feel. Also honours the fixed-header offset so section tops aren't hidden. */
  function anchorScroll() {
    var headerEl = $('.site-header');
    var animating = false;
    var scrollToY = function (endY) {
      endY = Math.max(0, Math.round(endY));
      if (lenis) { lenis.scrollTo(endY, { offset: 0 }); return; }   // smooth via Lenis
      if (reduce) { window.scrollTo({ top: endY, behavior: 'instant' }); return; }
      var startY = window.pageYOffset;
      var dist = endY - startY;
      if (!dist) return;
      var dur = Math.min(1000, Math.max(420, Math.abs(dist) * 0.42));
      var t0 = null;
      animating = true;
      var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        window.scrollTo({ top: Math.round(startY + dist * ease(p)), behavior: 'instant' });
        if (p < 1) requestAnimationFrame(step); else animating = false;
      };
      requestAnimationFrame(step);
      // Safety net: if rAF never advances the scroll (rare environments),
      // jump straight to the target so the link always works.
      setTimeout(function () {
        if (Math.abs(window.pageYOffset - startY) < 2) {
          window.scrollTo({ top: endY, behavior: 'instant' });
          animating = false;
        }
      }, 140);
    };
    var targetTop = function (href) {
      if (href === '#top') return 0;
      var el = document.getElementById(href.slice(1));
      if (!el) return null;
      var offset = headerEl ? headerEl.getBoundingClientRect().height : 0;
      return window.pageYOffset + el.getBoundingClientRect().top - offset - 6;
    };
    $$('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.length < 2) return;               // skip bare "#"
      a.addEventListener('click', function (e) {
        var top = targetTop(href);
        if (top === null) return;                 // no in-page target -> default
        e.preventDefault();
        scrollToY(top);
        if (history.pushState) history.pushState(null, '', href);
      });
    });
    // Direct links that arrive with a hash (e.g. .../#showroom): the native
    // jump is unreliable here too, so re-run it ourselves once laid out.
    if (location.hash && location.hash.length > 1) {
      window.addEventListener('load', function () {
        var top = targetTop(location.hash);
        if (top !== null) setTimeout(function () { if (!animating) scrollToY(top); }, 60);
      });
    }
  }

  /* ---------- active section in nav ---------- */
  function activeNav() {
    var links = $$('.main-nav a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = [];
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace(/^#/, '');
      var sec = id && document.getElementById(id);
      if (sec) map.push({ link: a, sec: sec });
    });
    if (!map.length) return;
    var visible = {};
    var apply = function () {
      var current = null;
      for (var i = 0; i < map.length; i++) { if (visible[map[i].sec.id]) { current = map[i].link; break; } }
      links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      if (current) { current.classList.add('is-active'); current.setAttribute('aria-current', 'true'); }
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      apply();
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    map.forEach(function (m) { io.observe(m.sec); });
  }

  /* ---------- mobile menu ---------- */
  function mobileMenu() {
    var btn = $('.nav-toggle'), menu = $('#mobile-menu');
    if (!btn || !menu) return;
    var open = function (state) {
      btn.setAttribute('aria-expanded', state);
      document.body.classList.toggle('menu-open', !!state);
      if (state) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('open'); });
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
        btn.setAttribute('aria-label', 'Menü schliessen');
        var first = $$('a', menu)[0]; if (first) first.focus();
      } else {
        menu.classList.remove('open');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
        btn.setAttribute('aria-label', 'Menü öffnen');
        if (document.activeElement && menu.contains(document.activeElement)) btn.focus();
        setTimeout(function () { if (btn.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, 360);
      }
    };
    btn.addEventListener('click', function () {
      open(btn.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { open(false); }); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
    // lightweight focus trap while the overlay is open
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || btn.getAttribute('aria-expanded') !== 'true') return;
      var f = $$('a, button', menu).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });
  }

  /* ---------- trust card: deliberate scroll entrance ---------- */
  function trustReveal() {
    var card = $('.trust-card');
    if (!card) return;
    if (reduce || !('IntersectionObserver' in window)) { card.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { card.classList.add('is-in'); obs.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(card);
  }

  /* ---------- reveal on scroll ---------- */
  function reveal() {
    var els = $$('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (c) { return c.classList.contains('reveal'); });
          var i = sibs.indexOf(el);
          el.style.transitionDelay = Math.min(i, 5) * 45 + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
      // beginnt schon kurz BEVOR der Block ins Bild kommt -> keine leeren Flächen beim Scrollen
    }, { threshold: 0, rootMargin: '0px 0px 12% 0px' });
    els.forEach(function (el) { io.observe(el); });

    // Sicherung: was nach 3 s aus irgendeinem Grund nicht eingeblendet wurde, wird sichtbar geschaltet.
    // (Hintergrund-Tabs, Screenshot-Renderer und alte Browser feuern Transitions sonst nie.)
    setTimeout(function () {
      els.forEach(function (el) { if (!el.classList.contains('in')) { el.style.transitionDelay = '0ms'; el.classList.add('in'); } });
    }, 3000);
  }

  /* ---------- count-up stats ---------- */
  function counters() {
    var nums = $$('.stat-num');
    if (!nums.length) return;
    var run = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = format(target) + suffix; return; }
      var dur = 1500, t0 = null;
      var tick = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var format = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'"); };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- video sections (only request a file that is configured) ---------- */
  function videoFallback() {
    // Auf Handys (und bei aktiviertem Datensparmodus) kein Video laden:
    // das Hero-Video allein wiegt ~18 MB. Das animierte Standbild bleibt stehen.
    var conn = navigator.connection || {};
    var lightMode = window.innerWidth <= 768 || conn.saveData === true ||
                    /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '');
    if (lightMode || reduce) return;

    $$('.media-video').forEach(function (v) {
      var key = v.getAttribute('data-video-key');
      var url = key && VIDEOS[key];
      if (!url) return; // no footage configured -> keep the animated image, no 404
      var src = document.createElement('source');
      src.src = url; src.type = 'video/mp4';
      v.appendChild(src);
      var ready = function () { if (v.readyState >= 2) v.classList.add('is-ready'); };
      v.addEventListener('loadeddata', ready);
      v.addEventListener('canplay', ready);
      try { v.load(); } catch (e) {}
    });
  }

  /* ---------- Leistungen: Video-Vorschau beim Hover ----------
     Das Video wird ERST beim ersten Hover geladen (preload="none"), damit die
     Seite nicht vier Clips im Voraus zieht. Auf Touch-Geraeten passiert nichts:
     dort gibt es keinen Hover, und vier Videos waeren reine Datenverschwendung. */
  function serviceClips() {
    var cards = $('.svc-card[data-clip]');
    if (!cards.length) return;
    var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover || reduce) return;

    var fmt = function (s) {
      s = Math.max(0, Math.floor(s || 0));
      return '0:' + (s < 10 ? '0' : '') + s;
    };

    cards.forEach(function (card) {
      var url = card.getAttribute('data-clip');
      if (!url) return;                       // kein Clip hinterlegt -> Standbild bleibt
      var vid = null, raf = 0;
      var timeEl = $('.svc-pv-time', card);
      var barEl = $('.svc-bar i', card);

      var tick = function () {
        if (!vid) return;
        var d = vid.duration || 0;
        if (timeEl) timeEl.textContent = fmt(vid.currentTime) + (d ? ' / ' + fmt(d) : '');
        if (barEl && d) barEl.style.width = ((vid.currentTime / d) * 100).toFixed(1) + '%';
        raf = requestAnimationFrame(tick);
      };

      var build = function () {
        vid = document.createElement('video');
        vid.muted = true; vid.loop = true; vid.playsInline = true;
        vid.setAttribute('playsinline', '');
        vid.setAttribute('preload', 'none');
        vid.setAttribute('aria-hidden', 'true');
        vid.src = url;
        $('.svc-media', card).appendChild(vid);
      };

      var hovering = false;
      var start = function () {
        if (!hovering || !vid) return;
        var p = vid.play();
        // Beim ersten Hover ist die Datei noch nicht da -> nach dem Laden erneut versuchen
        if (p && p.catch) p.catch(function () {
          vid.addEventListener('canplay', function again() {
            vid.removeEventListener('canplay', again);
            if (hovering) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); }
          });
        });
      };

      card.addEventListener('mouseenter', function () {
        hovering = true;
        if (!vid) { build(); vid.addEventListener('canplay', start); }
        card.classList.add('playing');
        start();
        cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
      });

      var stop = function () {
        hovering = false;
        card.classList.remove('playing');
        cancelAnimationFrame(raf);
        if (vid) { vid.pause(); try { vid.currentTime = 0; } catch (e) {} }
        if (barEl) barEl.style.width = '0';
        if (timeEl) timeEl.textContent = '0:00';
      };
      card.addEventListener('mouseleave', stop);
      card.addEventListener('blur', stop);
    });
  }

  /* ---------- before / after sliders ---------- */
  function beforeAfter() {
    $$('[data-ba]').forEach(function (ba) {
      var handle = $('.ba-handle', ba);
      var set = function (pct) {
        pct = Math.max(2, Math.min(98, pct));
        ba.style.setProperty('--pos', pct + '%');
        handle.setAttribute('aria-valuenow', Math.round(pct));
      };
      var fromEvent = function (clientX) {
        var r = ba.getBoundingClientRect();
        set(((clientX - r.left) / r.width) * 100);
      };
      var dragging = false;
      // Touch: erst entscheiden, ob gewischt (scrollen) oder gezogen (Regler) wird.
      // Ohne das schluckt das Bild jede vertikale Wischgeste und die Seite scrollt nicht mehr.
      var pending = false, x0 = 0, y0 = 0;

      var startMouse = function (e) {
        dragging = true; ba.classList.add('dragging');
        fromEvent(e.clientX);
        e.preventDefault();
      };
      var startTouch = function (e) {
        var t = e.touches[0];
        pending = true; dragging = false;
        x0 = t.clientX; y0 = t.clientY;
        // KEIN preventDefault -> vertikales Scrollen bleibt möglich
      };
      var move = function (e) {
        var p = e.touches ? e.touches[0] : e;
        if (pending) {
          var dx = Math.abs(p.clientX - x0), dy = Math.abs(p.clientY - y0);
          if (dx < 8 && dy < 8) return;          // noch zu klein, abwarten
          pending = false;
          if (dy > dx) return;                    // klar vertikal -> Seite scrollen lassen
          dragging = true; ba.classList.add('dragging');
        }
        if (!dragging) return;
        if (e.cancelable) e.preventDefault();
        fromEvent(p.clientX);
      };
      var end = function () { pending = false; dragging = false; ba.classList.remove('dragging'); };

      ba.addEventListener('mousedown', startMouse);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      ba.addEventListener('touchstart', startTouch, { passive: true });
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', end);
      window.addEventListener('touchcancel', end);

      handle.addEventListener('keydown', function (e) {
        var cur = parseFloat(ba.style.getPropertyValue('--pos')) || 50;
        if (e.key === 'ArrowLeft') { set(cur - 4); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { set(cur + 4); e.preventDefault(); }
        else if (e.key === 'Home') { set(2); e.preventDefault(); }
        else if (e.key === 'End') { set(98); e.preventDefault(); }
      });

      // subtle auto-hint when first scrolled into view
      if (!reduce && 'IntersectionObserver' in window) {
        var hinted = false;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting && !hinted) {
              hinted = true;
              var seq = [50, 62, 38, 50], i = 0;
              var step = function () { if (i < seq.length) { set(seq[i++]); setTimeout(step, 360); } };
              setTimeout(step, 400);
              io.unobserve(en.target);
            }
          });
        }, { threshold: 0.5 });
        io.observe(ba);
      }
    });
  }

  /* ---------- booking widget ---------- */
  function booking() {
    var form = $('#bookingForm');
    if (!form) return;

    var calGrid = $('#calGrid'), calTitle = $('#calTitle');
    var prevBtn = $('#calPrev'), nextBtn = $('#calNext');
    var slotWrap = $('#slotWrap'), slotsEl = $('#slots');
    var errorEl = $('#bfError');
    var success = $('#bookingSuccess');

    var MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var selectedDate = null, selectedSlot = null;

    function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function isWorkday(d) { return WORKDAYS.indexOf(d.getDay()) !== -1; }
    function selectable(d) { return d >= today && isWorkday(d); }

    // first month (from today) that actually has a selectable day -> never open on an empty month
    function firstSelectableMonth() {
      var v = new Date(today.getFullYear(), today.getMonth(), 1);
      for (var guard = 0; guard < 24; guard++) {
        var days = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
        for (var d = 1; d <= days; d++) {
          if (selectable(new Date(v.getFullYear(), v.getMonth(), d))) return v;
        }
        v = new Date(v.getFullYear(), v.getMonth() + 1, 1);
      }
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }
    var minMonth = firstSelectableMonth();
    var view = new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);

    function renderCal() {
      calTitle.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
      calGrid.innerHTML = '';
      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var startDow = (first.getDay() + 6) % 7; // Mo=0
      var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < startDow; i++) {
        var e = document.createElement('div'); e.className = 'cal-cell empty'; e.setAttribute('aria-hidden', 'true'); calGrid.appendChild(e);
      }
      for (var d = 1; d <= days; d++) {
        var date = new Date(view.getFullYear(), view.getMonth(), d);
        var cell = document.createElement('button');
        cell.type = 'button'; cell.className = 'cal-cell'; cell.textContent = d;
        cell.setAttribute('aria-label', date.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
        if (sameDay(date, today) && selectable(date)) cell.classList.add('today');
        if (!selectable(date)) {
          cell.classList.add('muted'); cell.disabled = true;
        } else {
          if (sameDay(date, selectedDate)) { cell.classList.add('selected'); cell.setAttribute('aria-selected', 'true'); }
          (function (dd, c) {
            c.addEventListener('click', function () {
              selectedDate = dd; selectedSlot = null;
              $$('.cal-cell.selected', calGrid).forEach(function (x) { x.classList.remove('selected'); x.removeAttribute('aria-selected'); });
              c.classList.add('selected'); c.setAttribute('aria-selected', 'true');
              renderSlots();
              clearError();
            });
          })(date, cell);
        }
        calGrid.appendChild(cell);
      }
      // never navigate before the first month that has selectable days
      prevBtn.disabled = (view.getFullYear() === minMonth.getFullYear() && view.getMonth() === minMonth.getMonth());
    }

    function renderSlots() {
      slotsEl.innerHTML = '';
      for (var h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
        var label = (h < 10 ? '0' + h : h) + ':00';
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'slot'; b.textContent = label;
        (function (lab, btn) {
          btn.addEventListener('click', function () {
            selectedSlot = lab;
            $$('.slot.selected', slotsEl).forEach(function (x) { x.classList.remove('selected'); });
            btn.classList.add('selected');
            clearError();
          });
        })(label, b);
        slotsEl.appendChild(b);
      }
      slotWrap.hidden = false;
    }

    prevBtn.addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal();
    });
    nextBtn.addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal();
    });

    function clearError() {
      errorEl.hidden = true; errorEl.textContent = '';
      $$('.invalid', form).forEach(function (el) {
        el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby');
      });
    }
    function showError(msg, el) {
      errorEl.textContent = msg; errorEl.hidden = false;
      if (el) {
        el.classList.add('invalid');
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('aria-describedby', 'bfError');
        el.focus();
      } else {
        // date/time errors: move focus so the announced error has context
        (selectedDate ? slotsEl : calGrid).focus();
      }
    }

    form.addEventListener('input', function (e) {
      if (e.target && e.target.classList) {
        e.target.classList.remove('invalid');
        e.target.removeAttribute('aria-invalid');
        e.target.removeAttribute('aria-describedby');
      }
    });

    function fmtDate(d) {
      return d.toLocaleDateString('de-CH', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();
      var name = $('#bf-name'), phone = $('#bf-phone'), email = $('#bf-email');
      if (!selectedDate) return showError('Bitte wählen Sie ein Datum aus.');
      if (!selectedSlot) return showError('Bitte wählen Sie eine Uhrzeit aus.');
      if (!name.value.trim()) return showError('Bitte geben Sie Ihren Namen an.', name);
      if (!phone.value.trim()) return showError('Bitte geben Sie eine Telefonnummer an.', phone);
      if (!email.checkValidity()) return showError('Bitte geben Sie eine gültige E-Mail-Adresse an.', email);

      var type = (form.querySelector('input[name="type"]:checked') || {}).value || 'Beratung';
      var msg = $('#bf-msg').value.trim();
      var dateStr = fmtDate(selectedDate);

      // compose mailto for forwarding
      var subject = 'Terminanfrage – ' + type + ' (' + dateStr + ', ' + selectedSlot + ')';
      var body =
        'Neue Terminanfrage über die Website:\n\n' +
        'Art der Beratung: ' + type + '\n' +
        'Datum: ' + dateStr + '\n' +
        'Uhrzeit: ' + selectedSlot + ' Uhr\n\n' +
        'Name: ' + name.value.trim() + '\n' +
        'Telefon: ' + phone.value.trim() + '\n' +
        'E-Mail: ' + email.value.trim() + '\n' +
        'Nachricht: ' + (msg || 'keine Angabe') + '\n';
      var mailto = 'mailto:' + BOOKING_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      var mailBtn = $('#successMail');
      if (mailBtn) mailBtn.setAttribute('href', mailto);
      var callBtn = $('#successCall');
      if (callBtn) callBtn.setAttribute('href', 'tel:' + BOOKING_PHONE.replace(/\s/g, ''));
      var sText = $('#successText');
      if (sText) sText.innerHTML = 'Nur noch ein Schritt: Damit Ihre Anfrage für <strong>' + dateStr +
        ' um ' + selectedSlot + ' Uhr</strong> (' + type + ') bei uns ankommt, senden Sie bitte die vorbereitete ' +
        'E-Mail ab, oder rufen Sie uns direkt an.';

      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      // open the prepared e-mail so the request actually reaches the owner
      try { window.location.href = mailto; } catch (e) {}
    });

    var resetBtn = $('#successReset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      form.reset();
      selectedDate = null; selectedSlot = null;
      slotWrap.hidden = true;
      view = new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
      renderCal();
      success.hidden = true; form.hidden = false;
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });

    renderCal();
  }

  /* ---------- atelier play buttons -> jump to reels ---------- */
  document.addEventListener('click', function (e) {
    var play = e.target.closest && e.target.closest('.atelier-play');
    if (play) {
      var social = document.getElementById('social');
      if (social) social.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }
  });

  /* ---------- FAQ: golden-angle spiral background + search filter ---------- */
  (function initFaq() {
    var host = document.getElementById('faqSpiral');
    if (host && !host.firstChild) {
      var NS = 'http://www.w3.org/2000/svg';
      var SIZE = 620, CENTER = SIZE / 2, PAD = 4;
      var N = 440, DOT = 1.9, DUR = 3.2;
      var GOLDEN = Math.PI * (3 - Math.sqrt(5));
      var MAXR = CENTER - PAD - DOT, COLOR = '#C7A24E';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', SIZE); svg.setAttribute('height', SIZE);
      svg.setAttribute('viewBox', '0 0 ' + SIZE + ' ' + SIZE);
      for (var i = 0; i < N; i++) {
        var idx = i + 0.5, frac = idx / N;
        var r = Math.sqrt(frac) * MAXR, th = idx * GOLDEN;
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', (CENTER + r * Math.cos(th)).toFixed(2));
        c.setAttribute('cy', (CENTER + r * Math.sin(th)).toFixed(2));
        c.setAttribute('r', DOT);
        c.setAttribute('fill', COLOR);
        c.setAttribute('opacity', '0.55');
        if (!reduce) {
          var begin = (frac * DUR).toFixed(2) + 's';
          var ar = document.createElementNS(NS, 'animate');
          ar.setAttribute('attributeName', 'r');
          ar.setAttribute('values', (DOT * 0.5) + ';' + (DOT * 1.5) + ';' + (DOT * 0.5));
          ar.setAttribute('dur', DUR + 's'); ar.setAttribute('begin', begin);
          ar.setAttribute('repeatCount', 'indefinite'); ar.setAttribute('calcMode', 'spline');
          ar.setAttribute('keyTimes', '0;0.5;1'); ar.setAttribute('keySplines', '0.4 0 0.6 1;0.4 0 0.6 1');
          c.appendChild(ar);
          var ao = document.createElementNS(NS, 'animate');
          ao.setAttribute('attributeName', 'opacity');
          ao.setAttribute('values', '0.18;0.85;0.18');
          ao.setAttribute('dur', DUR + 's'); ao.setAttribute('begin', begin);
          ao.setAttribute('repeatCount', 'indefinite'); ao.setAttribute('calcMode', 'spline');
          ao.setAttribute('keyTimes', '0;0.5;1'); ao.setAttribute('keySplines', '0.4 0 0.6 1;0.4 0 0.6 1');
          c.appendChild(ao);
        }
        svg.appendChild(c);
      }
      host.appendChild(svg);
    }

    var input = document.getElementById('faqSearch');
    var grid = document.getElementById('faqGrid');
    var empty = document.getElementById('faqEmpty');
    if (input && grid) {
      var items = [].slice.call(grid.querySelectorAll('.faq-item'));
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase(), shown = 0;
        items.forEach(function (it) {
          var match = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
          it.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    }
  })();

})();
