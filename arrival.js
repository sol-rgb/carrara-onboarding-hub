/* The arrival, ported from the letter (Carrara Identity/Letters To Partners/idea-4).

   The strip runs across the middle of the top sheet. Its free end lies folded
   back at the left of the page; the reader takes it and pulls to the right, and
   the strip comes away behind the hand. It never mends: let go halfway and it
   stays torn halfway. Once it is off the sheet is in two and opens. A tap or
   Enter pulls it in one go, for anyone who does not drag.

   Self-contained: it touches nothing of app.js, and nothing of the POps seam. */

(function () {
  var vellum = document.getElementById('vellum');
  if (!vellum) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var SEEN = 'carrara_hub_arrival';
  var sealed = false;

  /* ---------------------------------------------------------------- the sound of it
     Tearing a perforation is a row of small ticks, one per hole, over a dry
     rustle that follows the speed of the hand. Both are filtered noise, made
     here; nothing is loaded. Quiet, and only once the reader has touched. */
  var sound = (function () {
    var ctx = null, noise = null, rustle = null, acc = 0;

    function wake() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var d = noise.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        var src = ctx.createBufferSource();
        src.buffer = noise;
        src.loop = true;
        var band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = 3400;
        band.Q.value = 0.6;
        rustle = ctx.createGain();
        rustle.gain.value = 0;
        src.connect(band).connect(rustle).connect(ctx.destination);
        src.start();
      } catch (e) { ctx = null; }
    }

    function tick(at, level) {
      var src = ctx.createBufferSource();
      src.buffer = noise;
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1600;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(level, at + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
      src.connect(hp).connect(g).connect(ctx.destination);
      src.start(at, Math.random() * 0.9, 0.05);
    }

    function tear(dx) {
      if (!ctx || reduced) return;
      var now = ctx.currentTime;
      var speed = Math.min(dx / 16, 1);
      rustle.gain.cancelScheduledValues(now);
      rustle.gain.setTargetAtTime(0.05 + speed * 0.09, now, 0.012);
      rustle.gain.setTargetAtTime(0, now + 0.06, 0.05);
      acc += dx;
      var n = 0;
      while (acc >= 5 && n < 6) {
        acc -= 5; n++;
        tick(now + n * 0.006 + Math.random() * 0.004, 0.05 + Math.random() * 0.07);
      }
      if (acc >= 5) acc = acc % 5;
    }

    function stop() {
      if (!ctx) return;
      rustle.gain.cancelScheduledValues(ctx.currentTime);
      rustle.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    }

    return { wake: wake, tear: tear, stop: stop };
  })();

  /* ---------------------------------------------------------------- the tear strip */
  var tear = (function () {
    var tape = document.getElementById('tape');
    var strip = document.getElementById('tape-strip');
    var pulled = document.getElementById('tape-pulled');
    var top = vellum.querySelector('.vellum__sheet--top');
    var bot = vellum.querySelector('.vellum__sheet--bot');

    var START = 36;   /* the free end lies a square's width in */
    var GIVE = 120;   /* how far the paper will follow the hand off the line */
    var BOW = 0.58;   /* and how far round it will come doing it */
    var t = START;
    var give = 0;
    var done = false, drag = null, auto = null, hintTimer = null;

    function width() { return tape.offsetWidth; }
    function end() { return width(); }
    function half() { return START + 0.5 * (end() - START); }

    var tex = { x: 0, y: 0 };

    /* Paper gives before it tears. The length in the hand is still joined at the
       tear, so it swings about that point and stretches to reach the hand. */
    function pull() { return Math.max(-GIVE, Math.min(GIVE, give)) * 0.72; }

    /* It bows rather than hinging: it leaves the tear level and turns evenly
       along itself until its end is where the hand is. A length L turned evenly
       through A ends up L(1 - cos A)/A off the line, so take the small turn that
       would do it and correct once. */
    function turn(held, g) {
      if (!g) return 0;
      var A = 2 * g / held, drop = held * (1 - Math.cos(A)) / A;
      if (drop) A *= g / drop;
      return BOW * Math.tanh(A / BOW);
    }

    var SEGS = 12;
    var segs = [], shades = [];
    var shadow = pulled.appendChild(document.createElement('div'));
    shadow.className = 'tape__shadow';
    for (var i = 0; i < SEGS; i++) {
      var sh = shadow.appendChild(document.createElement('div'));
      sh.className = 'tape__shade';
      shades.push(sh);
      var d = pulled.appendChild(document.createElement('div'));
      d.className = 'tape__seg' + (i ? '' : ' tape__seg--fold') + (i === SEGS - 1 ? ' tape__seg--end' : '');
      segs.push(d);
    }

    function render() {
      var held = Math.min(72 + (t - START) * 0.28, 170);
      var A = turn(held, pull()), seg = held / SEGS, x = 0, y = 0;
      strip.style.left = t + 'px';
      pulled.style.left = t + 'px';
      for (var i = 0; i < SEGS; i++) {
        var a = A * (i + 0.5) / SEGS;
        var w = (seg + 1) + 'px';
        var lay = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px) rotate(' + (a * 180 / Math.PI).toFixed(2) + 'deg)';
        segs[i].style.width = shades[i].style.width = w;
        segs[i].style.transform = shades[i].style.transform = lay;
        segs[i].style.setProperty('--tex-x', (tex.x - t - i * seg) + 'px');
        x += seg * Math.cos(a);
        y += seg * Math.sin(a);
      }
      strip.style.setProperty('--tex-x', (tex.x - t) + 'px');
      pulled.style.opacity = t >= width() ? '0' : '';
      vellum.classList.toggle('is-started', t > START + 6);
    }

    /* Both pieces of the sheet are cut along the strip's line, with the small
       teeth a perforation leaves — a little uneven, the same every time so it
       does not shimmer. */
    var SCAN = { w: 820, h: 1024 };   /* the scan, assets/vellum/paper-bkg.png */
    function teeth() {
      var w = top.offsetWidth, h = top.offsetHeight;
      var bx = top.offsetLeft, by = top.offsetTop;
      var y1 = tape.offsetTop, y2 = y1 + tape.offsetHeight;
      var tilt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt')) || 0;
      var th = tilt * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
      function local(X, Y) {
        var x = X - bx - w / 2, y = Y - by - h / 2;
        return (w / 2 + c * x + sn * y).toFixed(1) + 'px ' + (h / 2 - sn * x + c * y).toFixed(1) + 'px';
      }
      var a = [], b = [], seed = 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      var vw = vellum.offsetWidth;
      for (var x = -60; x <= vw + 60; x += 5) {
        a.push(local(x, y1 + (x % 10 ? 1.4 : 0.2) + rnd() * 0.8));
        b.push(local(x, y2 - (x % 10 ? 0.2 : 1.4) - rnd() * 0.8));
      }
      top.style.clipPath = 'polygon(' + local(-60, -400) + ', ' + local(vw + 60, -400) + ', ' + a.reverse().join(', ') + ')';
      bot.style.clipPath = 'polygon(' + b.join(', ') + ', ' + local(vw + 60, h + 400) + ', ' + local(-60, h + 400) + ')';

      var s = Math.max(w / SCAN.w, h / SCAN.h), tw = SCAN.w * s, tht = SCAN.h * s;
      tex.x = bx + (w - tw) / 2;
      tex.y = by + (h - tht) / 2 - y1 + 1;
      tape.style.setProperty('--tex-y', tex.y + 'px');
      tape.style.setProperty('--tex-w', tw + 'px');
      tape.style.setProperty('--tex-h', tht + 'px');
    }

    function near(ev) {
      var r = strip.getBoundingClientRect();
      var p = pulled.getBoundingClientRect();
      var y = ev.clientY;
      return y > Math.min(r.top, p.top) - 34 && y < Math.max(r.bottom, p.bottom) + 34;
    }

    function advance(nt) {
      nt = Math.min(Math.max(nt, t), width());
      var dx = nt - t;
      if (dx <= 0) return;
      t = nt;
      sound.tear(dx);
      render();
      if (t >= end()) finish();
    }

    function finish() {
      if (done) return;
      done = true;
      drag = null;
      if (auto) cancelAnimationFrame(auto);
      t = width();
      render();
      sound.stop();
      vellum.classList.remove('is-pulling');
      vellum.classList.add('is-torn');
      setTimeout(openUp, reduced ? 0 : 220);
    }

    /* pull the rest in one go, easing in and out like a hand */
    function pullAll() {
      if (done) return;
      unhint();
      sound.wake();
      if (reduced) { finish(); return; }
      var from = t, to = width(), span = to - from, give0 = give;
      var dur = Math.max(380, 1100 * span / Math.max(1, to - START));
      var t0 = performance.now();
      vellum.classList.add('is-pulling');
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        give = give0 * (1 - e);
        advance(from + span * e);
        render();
        if (!done) auto = requestAnimationFrame(step);
      })(t0);
    }

    function hint() {
      if (vellum.classList.contains('is-loading')) return;
      vellum.classList.remove('is-hinting');
      void vellum.offsetWidth;
      vellum.classList.add('is-hinting');
      setTimeout(function () { vellum.classList.remove('is-hinting'); }, 1150);
    }

    function unhint() { clearInterval(hintTimer); hintTimer = null; }

    vellum.addEventListener('pointerdown', function (ev) {
      if (!sealed || done || auto) return;
      sound.wake();
      if (!near(ev)) { hint(); return; }
      unhint();
      drag = { x: ev.clientX, y: ev.clientY, t: t, moved: 0, id: ev.pointerId };
      try { vellum.setPointerCapture(ev.pointerId); } catch (e) {}
      vellum.classList.add('is-pulling');
    });

    vellum.addEventListener('pointermove', function (ev) {
      if (!drag || ev.pointerId !== drag.id) return;
      drag.moved = Math.max(drag.moved, Math.abs(ev.clientX - drag.x), Math.abs(ev.clientY - drag.y));
      give = ev.clientY - drag.y;
      advance(drag.t + (ev.clientX - drag.x));
      render();
      if (!done && t >= half()) { drag = null; pullAll(); }
    });

    function release(ev) {
      if (!drag || ev.pointerId !== drag.id) return;
      var tap = drag.moved < 4;
      drag = null;
      sound.stop();
      if (done) return;
      if (tap || t >= half()) { pullAll(); return; }
      give = 0;
      vellum.classList.remove('is-pulling');
      render();
    }

    vellum.addEventListener('pointerup', release);
    vellum.addEventListener('pointercancel', release);

    vellum.addEventListener('keydown', function (ev) {
      if (!sealed || done) return;
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      pullAll();
    });

    return {
      reset: function () {
        done = false; drag = null; give = 0; t = START;
        if (auto) cancelAnimationFrame(auto);
        auto = null;
        teeth();
        render();
        unhint();
        if (!reduced) hintTimer = setInterval(hint, 4200);
        setTimeout(hint, 1400);
      },
      layout: function () { teeth(); render(); },
      pullAll: pullAll
    };
  })();

  /* the sheet waits until its paper has come in whole, so nothing shows half made */
  function paperReady() {
    var url = getComputedStyle(document.documentElement).getPropertyValue('--vellum-tex')
      .trim().replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    if (!url) return Promise.resolve();
    return Promise.race([
      new Promise(function (res) {
        var im = new Image();
        im.onload = im.onerror = function () {
          Promise.race([
            im.decode ? im.decode() : Promise.resolve(),
            new Promise(function (r) { setTimeout(r, 300); })
          ]).then(res, res);
        };
        im.src = url;
      }),
      new Promise(function (r) { setTimeout(r, 6000); })
    ]);
  }

  function seal() {
    sealed = true;
    vellum.hidden = false;
    vellum.classList.remove('is-open', 'is-torn', 'is-pulling', 'is-started');
    document.body.classList.add('is-sealed', 'is-loading');
    vellum.classList.add('is-loading');
    paperReady().then(function () {
      var shown = false;
      var show = function () {
        if (shown) return;
        shown = true;
        vellum.classList.remove('is-loading');
        tear.reset();
        setTimeout(function () { document.body.classList.remove('is-loading'); }, reduced ? 0 : 460);
      };
      requestAnimationFrame(show);
      setTimeout(show, 60);
    });
    window.scrollTo(0, 0);
    tear.reset();
  }

  function openUp() {
    if (!sealed) return;
    sealed = false;
    try { sessionStorage.setItem(SEEN, '1'); } catch (e) {}
    vellum.classList.add('is-open');
    document.body.classList.remove('is-sealed');
    setTimeout(function () { vellum.hidden = true; }, reduced ? 0 : 1300);
  }

  /* The hub arrives once a visit: someone who comes back mid-read should not have
     to tear it open again. ?replay asks for it again, ?replay=0 skips it. */
  function seen() {
    if (params.has('replay')) return params.get('replay') === '0';
    try { return sessionStorage.getItem(SEEN) === '1'; } catch (e) { return false; }
  }

  if (seen()) {
    vellum.hidden = true;
  } else {
    seal();
  }

  window.addEventListener('resize', function () { if (sealed) tear.layout(); });
})();
