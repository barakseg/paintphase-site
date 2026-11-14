// PaintPhase landing page. No library, no network call.
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The fade-in on scroll needs the script and is not for reduced motion.
  if (!calm) root.classList.add('js');
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  // Masthead: a glass bar once the page has moved.
  var mast = $('[data-masthead]');
  var bar = $('[data-progress]');
  function onScrollMast() {
    mast.classList.toggle('stuck', scrollY > 12);
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) + ')';
  }

  // The header names the section on the screen.
  var navLinks = $$('.masthead nav a');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(function (sec) { spy.observe(sec); });

  // The hero picture leans a little toward a mouse pointer.
  var heroArt = $('.hero-art'), finder = heroArt && $('.viewfinder', heroArt);
  if (finder && !calm && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    heroArt.addEventListener('pointermove', function (e) {
      var r = heroArt.getBoundingClientRect();
      finder.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 5 + 'deg');
      finder.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 4 + 'deg');
    });
    heroArt.addEventListener('pointerleave', function () {
      finder.style.setProperty('--ry', '0deg'); finder.style.setProperty('--rx', '0deg');
    });
  }

  // Reveal on scroll.
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('main h2').forEach(function (el) { el.classList.add('reveal'); });
  $$('.reveal, .slots').forEach(function (el) { seen.observe(el); });

  // Compare sliders. The hero one sweeps once by itself.
  $$('[data-compare]').forEach(function (box) {
    var input = $('input', box);
    function set(v) { box.style.setProperty('--reveal', v + '%'); }
    input.addEventListener('input', function () { box.dataset.touched = '1'; set(input.value); });
    set(input.value);
    if (calm || !box.hasAttribute('data-sweep')) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now();
      (function step(t) {
        if (box.dataset.touched) return;
        var k = Math.min(1, (t - t0) / 4500);
        var v = 50 + 37 * Math.sin(k * Math.PI * 2);
        if (k === 1) v = 50;
        input.value = v; set(v);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.5 });
    io.observe(box);
  });

  // The painting grows.
  var grow = $('[data-grow]');
  var follow = function () {};
  if (grow) {
    var frames = $$('[data-grow-frames] img', grow);
    var n = frames.length;
    var count = $('[data-grow-count]', grow), date = $('[data-grow-date]', grow);
    var range = $('[data-grow-range]', grow), dots = $('[data-grow-dots]', grow);
    var button = $('[data-grow-play]', grow);
    frames.forEach(function () { dots.appendChild(document.createElement('i')); });
    var dotEls = $$('i', dots), at = 0, timer = 0;
    function show(i) {
      at = i;
      frames.forEach(function (img, k) {
        img.classList.toggle('on', k <= i);
        if (k <= i + 2) img.loading = 'eager';
      });
      count.textContent = 'STARRED SNAP ' + (i + 1) + ' OF ' + n;
      date.textContent = frames[i].dataset.date;
      dotEls.forEach(function (d, k) { d.classList.toggle('on', k <= i); });
      range.value = i;
      range.setAttribute('aria-valuetext', 'Starred snap ' + (i + 1) + ' of ' + n + ', ' + frames[i].dataset.date);
    }
    function label() {
      var playing = !!timer;
      button.textContent = playing ? 'Pause' : (at === n - 1 ? 'Play again' : 'Play');
      button.setAttribute('aria-pressed', playing);
    }
    function stop() { clearInterval(timer); timer = 0; label(); }
    function play() {
      if (timer) return;
      if (at === n - 1) show(0);
      timer = setInterval(function () {
        if (at < n - 1) show(at + 1);
        if (at >= n - 1) stop();
      }, 900);
      label();
    }
    // The picture follows the scroll while it passes through the window. The
    // page is never held. Play or the slider take over until it leaves view.
    var growBox = $('[data-grow-frames]', grow), manual = false;
    follow = function () {
      if (calm || manual || timer) return;
      var r = growBox.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = (innerHeight - r.top) / (innerHeight + r.height);
      var q = Math.max(0, Math.min(1, (p - 0.30) / 0.32));
      var i = Math.round(q * (n - 1));
      if (i !== at) { show(i); label(); }
    };
    button.addEventListener('click', function () { manual = true; if (timer) stop(); else play(); });
    range.addEventListener('input', function () { manual = true; stop(); show(+range.value); label(); });
    show(0); label();
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) return;
      if (timer) stop();
      manual = false;
    }).observe(growBox);
    document.addEventListener('visibilitychange', function () { if (document.hidden && timer) stop(); });
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollMast(); follow(); });
  }, { passive: true });
  onScrollMast();

  // Lenses: tabs swap the real app pictures on both sides.
  var tabs = $('[data-lens-tabs]');
  if (tabs) {
    var buttons = $$('[role=tab]', tabs), stage = $('[data-lens-stage]');
    var names = { work: 'Your painting', ref: 'The reference' };
    $$('.lens-stack', stage).forEach(function (stack) {
      buttons.forEach(function (b, i) {
        if ($('[data-lens="' + b.dataset.lens + '"]', stack)) return;
        var img = new Image();
        img.width = 1080; img.height = 720; img.loading = 'lazy'; img.decoding = 'async';
        img.dataset.lens = b.dataset.lens;
        img.alt = names[stack.dataset.side] + ', ' + $('b', b).textContent + ' lens';
        img.src = 'assets/art/lens-' + b.dataset.lens + '-' + stack.dataset.side + '.webp';
        if (i === 0) img.className = 'on';
        stack.appendChild(img);
      });
    });
    function pick(b, focus) {
      buttons.forEach(function (o) {
        var on = o === b;
        o.setAttribute('aria-selected', on); o.tabIndex = on ? 0 : -1;
      });
      stage.setAttribute('aria-labelledby', b.id);
      var name = $('[data-lens-name]', stage);
      if (name) name.textContent = $('b', b).textContent;
      var q = $('[data-lens-question]', stage);
      if (q) q.textContent = $('span', b).textContent;
      if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: b.offsetLeft - 24, behavior: calm ? 'auto' : 'smooth' });
      $$('.lens-stack img', stage).forEach(function (img) {
        img.classList.toggle('on', img.dataset.lens === b.dataset.lens);
      });
      if (focus) b.focus();
    }
    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        pick(buttons[(to + buttons.length) % buttons.length], true);
      });
    });
  }

  // Edges / Poster: two real Studio screenshots; the chosen one comes to the front.
  var studyTabs = $$('[data-study]');
  if (studyTabs.length) {
    var studyNote = $('#study-description'), studyShots = $$('.phone-stack img');
    var notes = {
      edges: 'Follow the main contours. Use the numbered grid to check where they meet.',
      poster: 'Group the picture into broad masses. In the app, tap a swatch to outline its areas.'
    };
    var selectStudy = function (tab, focus) {
      studyTabs.forEach(function (t) { t.setAttribute('aria-selected', t === tab); t.tabIndex = t === tab ? 0 : -1; });
      $('#study-panel').setAttribute('aria-labelledby', tab.id);
      studyNote.textContent = notes[tab.dataset.study];
      studyShots.forEach(function (img) { img.classList.toggle('front', img.dataset.view === tab.dataset.study); });
      if (focus) tab.focus();
    };
    studyTabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectStudy(tab); });
      tab.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
        e.preventDefault();
        selectStudy(e.key === 'Home' ? studyTabs[0] : e.key === 'End' ? studyTabs[studyTabs.length - 1] : studyTabs[1 - i], true);
      });
    });
    studyShots.forEach(function (img) {
      img.addEventListener('click', function (e) {
        if (img.classList.contains('front')) return;
        e.stopImmediatePropagation();
        selectStudy(studyTabs.filter(function (t) { return t.dataset.study === img.dataset.view; })[0]);
      });
    });
  }

  // The clip plays, muted, while it is in view; never under reduced motion.
  var film = $('[data-film]');
  if (film) {
    var filmSeen = false;
    film.addEventListener('pause', function () { if (filmSeen && !document.hidden) film.dataset.paused = '1'; });
    film.addEventListener('play', function () { delete film.dataset.paused; });
    new IntersectionObserver(function (es) {
      filmSeen = es[0].isIntersecting;
      if (filmSeen) { if (!calm && !film.dataset.paused) { var p = film.play(); if (p && p.catch) p.catch(function () {}); } }
      else film.pause();
    }, { threshold: 0.5 }).observe(film);
    document.addEventListener('visibilitychange', function () { if (document.hidden) film.pause(); });
  }

  // Phone screenshots open larger.
  var zoom = $('[data-zoom]');
  if (zoom && zoom.showModal) {
    $$('.phone-stack img, .mixing-shot img').forEach(function (img) {
      img.tabIndex = 0; img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge: ' + img.alt);
      function open() { var z = $('img', zoom); z.src = img.src; z.alt = img.alt; zoom.showModal(); }
      img.addEventListener('click', open);
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      zoom.addEventListener('close', function () { if (document.activeElement === document.body) img.focus(); });
    });
    zoom.addEventListener('click', function (e) { if (e.target === zoom) zoom.close(); });
  }
})();
