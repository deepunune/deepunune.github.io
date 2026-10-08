/* Theme toggle, navigation, publication explorer, BibTeX, hero discharge.
   BUILD 2026-10-08 */
(function () {
  'use strict';

  /* Printed once so a stale asset is visible in the console rather than only
     as mysteriously missing behaviour. */
  var BUILD = '2026-10-08';
  try { console.info('site assets build ' + BUILD); } catch (e) {}

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- theme ---------- */
  var tb = document.getElementById('themetoggle');
  if (tb) {
    tb.addEventListener('click', function () {
      var light = (getComputedStyle(root).colorScheme || '').indexOf('light') > -1;
      var next = light ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      if (window.__sparkRecolor) window.__sparkRecolor();
    });
  }

  /* ---------- mobile navigation ---------- */
  var btn = document.getElementById('navtoggle');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    var desktop = window.matchMedia('(min-width: 60rem)');
    var sync = function () {
      if (desktop.matches) { nav.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      else { nav.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    };
    sync();
    desktop.addEventListener('change', sync);
    btn.addEventListener('click', function () {
      var open = nav.hidden;
      nav.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- image placeholders ----------
     Any image marked data-ph that has not been added yet is replaced by a
     labelled box naming the exact file to drop in, so a half-filled site
     never looks broken and always says what it is waiting for. */
  Array.prototype.forEach.call(document.querySelectorAll('img[data-ph]'), function (img) {
    img.addEventListener('error', function () {
      var ph = document.createElement('div');
      var mono = img.getAttribute('data-ph-text');
      ph.className = mono ? 'ph ph--chip' : 'ph';
      ph.textContent = mono || img.getAttribute('src');
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', mono
        ? ''                       /* the pill's own text already names the link */
        : 'Image not added yet: ' + img.getAttribute('src'));
      img.replaceWith(ph);
    });
  });

  /* ---------- BibTeX ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('.bibbtn') : null;
    if (!b) return;
    var pre = b.parentNode.querySelector('.bib');
    if (!pre) return;
    var text = pre.textContent;
    var done = function (ok) {
      b.textContent = ok ? 'Copied' : 'Select it';
      b.classList.toggle('is-done', ok);
      if (!ok) {
        pre.style.display = 'block';
        var r = document.createRange();
        r.selectNodeContents(pre);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
      setTimeout(function () { b.textContent = 'BibTeX'; b.classList.remove('is-done'); }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); },
                                               function () { done(false); });
    } else { done(false); }
  });

  /* ---------- publication explorer ----------
     Every publication is already in the HTML. The filters only hide and show,
     so the full list stays in the page for search engines and for anyone
     without JavaScript. */
  var explorer = document.getElementById('explorer');
  if (explorer) {
    var pubs = Array.prototype.map.call(document.querySelectorAll('.pub[data-year]'), function (el) {
      var txt = '';
      ['.pub__authors', '.pub__title', '.pub__venue'].forEach(function (sel) {
        var n = el.querySelector(sel);
        if (n) txt += ' ' + n.textContent;
      });
      return {
        el: el,
        year: el.getAttribute('data-year'),
        topics: (el.getAttribute('data-topics') || '').split(' '),
        text: txt.toLowerCase().replace(/\s+/g, ' ')
      };
    });
    var groups = Array.prototype.slice.call(document.querySelectorAll('.pubyear'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('.pubsec'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var yrs = Array.prototype.slice.call(document.querySelectorAll('.yr'));
    var search = document.getElementById('pubsearch');
    var countEl = document.getElementById('pubcount');
    var resetEls = Array.prototype.slice.call(document.querySelectorAll('#pubreset, [data-reset]'));
    var noResults = document.getElementById('noresults');

    var topic = 'all', year = null, q = '';

    function apply() {
      var shown = 0;
      pubs.forEach(function (p) {
        var ok = (topic === 'all' || p.topics.indexOf(topic) > -1) &&
                 (!year || p.year === year) &&
                 (!q || p.text.indexOf(q) > -1);
        p.el.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) {
        g.hidden = !g.querySelector('.pub:not([hidden])');
      });
      sections.forEach(function (s) {
        s.hidden = !s.querySelector('.pub:not([hidden])');
      });

      var filtered = (topic !== 'all' || year || q);
      if (noResults) noResults.hidden = shown !== 0;
      resetEls.forEach(function (r) { r.hidden = !filtered; });

      if (countEl) {
        countEl.textContent = !filtered
          ? 'Showing all ' + pubs.length + ' publications'
          : 'Showing ' + shown + ' of ' + pubs.length +
            (year ? ' · ' + year : '') +
            (q ? ' · “' + q + '”' : '');
      }
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        topic = c.getAttribute('data-topic');
        chips.forEach(function (o) {
          var on = o === c;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', String(on));
        });
        apply();
      });
    });

    yrs.forEach(function (y) {
      y.addEventListener('click', function () {
        var v = y.getAttribute('data-year');
        year = (year === v) ? null : v;          // click again to clear
        yrs.forEach(function (o) {
          o.setAttribute('aria-pressed', String(o.getAttribute('data-year') === year));
        });
        apply();
      });
    });

    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { q = search.value.trim().toLowerCase(); apply(); }, 120);
      });
    }

    resetEls.forEach(function (r) {
      r.addEventListener('click', function () {
        topic = 'all'; year = null; q = '';
        if (search) search.value = '';
        chips.forEach(function (o) {
          var on = o.getAttribute('data-topic') === 'all';
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', String(on));
        });
        yrs.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        apply();
        explorer.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });

    apply();
  }

  /* ---------- hero discharge ----------
     Slow drifting points with an occasional arc between two of them. Quiet by
     design: it should read as texture. Off entirely for reduced motion, and
     paused whenever the hero is off-screen or the tab is hidden. */
  var cv = document.getElementById('spark');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d');
    var pts = [], arcs = [], w = 0, h = 0, dpr = 1, raf = null, visible = true, last = 0;
    var cAccent = '#6fe3ff', cCopper = '#e8763a';

    function readColors() {
      var cs = getComputedStyle(root);
      cAccent = (cs.getPropertyValue('--accent') || cAccent).trim();
      cCopper = (cs.getPropertyValue('--copper') || cCopper).trim();
    }
    window.__sparkRecolor = readColors;

    function size() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pts.length) {
        var n = Math.round(Math.min(46, Math.max(16, w / 22)));
        for (var i = 0; i < n; i++) {
          pts.push({ x: Math.random() * w, y: Math.random() * h,
                     vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14,
                     r: Math.random() * 1.2 + .5 });
        }
      }
    }

    function jag(x1, y1, x2, y2) {
      var steps = 7, path = [[x1, y1]];
      for (var i = 1; i < steps; i++) {
        var t = i / steps;
        path.push([x1 + (x2 - x1) * t + (Math.random() - .5) * 13,
                   y1 + (y2 - y1) * t + (Math.random() - .5) * 13]);
      }
      path.push([x2, y2]);
      return path;
    }

    function spawn() {
      if (pts.length < 2) return;
      var a = pts[(Math.random() * pts.length) | 0], best = null, bd = 1e9;
      for (var i = 0; i < pts.length; i++) {
        var b = pts[i];
        if (b === a) continue;
        var d = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
        if (d < bd && d > 900) { bd = d; best = b; }
      }
      if (best && bd < 42000) arcs.push({ p: jag(a.x, a.y, best.x, best.y), life: 1 });
    }

    function frame(ts) {
      raf = null;
      if (!visible) return;
      var dt = Math.min(40, ts - (last || ts)); last = ts;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = cAccent;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx * (dt / 16); p.y += p.vy * (dt / 16);
        if (p.x < 0) p.x += w; if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; if (p.y > h) p.y -= h;
        ctx.globalAlpha = .22;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }

      for (var j = arcs.length - 1; j >= 0; j--) {
        var a = arcs[j];
        a.life -= dt / 420;
        if (a.life <= 0) { arcs.splice(j, 1); continue; }
        ctx.globalAlpha = Math.max(0, a.life) * .5;
        ctx.strokeStyle = a.life > .6 ? cCopper : cAccent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.p[0][0], a.p[0][1]);
        for (var k = 1; k < a.p.length; k++) ctx.lineTo(a.p[k][0], a.p[k][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function still() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cAccent; ctx.globalAlpha = .22;
      pts.forEach(function (p) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function start() {
      if (reduced.matches) { still(); return; }
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    readColors(); size(); start();
    setInterval(function () { if (visible && !reduced.matches) spawn(); }, 2200);

    window.addEventListener('resize', function () { pts = []; size(); still(); });
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      if (visible) start(); else stop();
    });
    reduced.addEventListener('change', function () {
      stop(); if (reduced.matches) still(); else start();
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting && !document.hidden;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(cv);
    }
  }
})();
