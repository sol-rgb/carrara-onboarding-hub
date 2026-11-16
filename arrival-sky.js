/* The stamp's sky.

   The ticket's picture half is one ember plate with the quarry engraved into it, and
   above the quarry the plate was empty. It is weather now, printed through the press at
   carrara.is/labs (`labs/screen.js`): one grid of square dots, a dot to a cell, and the
   dot's AREA is the ink that cell asks for, so its side goes by the square root. One ink
   at full strength -- the tone is carried by the size of the dot and nothing else, the
   way a press carries it.

   The dots are INK, the engraving's own grafite, so the sky and the mountain are one
   plate in one colour. That inverts what a cloud is: a cloud is where the ink GATHERS,
   not where the plate failed to take, so the weather reads dark on ember rather than
   light. The first attempt at a dark sky did bury the mountain, but that was before the
   weave had a floor and a ceiling, and before the quarry became a plate that masks what
   is behind it. Held off both stops and covered by the rock, the ink is weather behind a
   mountain rather than dirt on top of one.

   There is no stone here and no scene, so there is no three.js and no shader and nothing
   to read a tone off: the tone IS the weather. Three octaves of value noise in three
   dimensions -- two across the plate and one through time -- so a cloud remakes itself
   where it stands instead of sliding past like a banner, with a slow drift under it for
   the wind.

   The sky runs the WHOLE plate, edge to edge. It used to be faded out above the ridge,
   because the quarry was an engraving multiplied into the ember and a sky behind it would
   have stippled its hatching. The quarry is an opaque plate now, carrying its own ember
   and transparent above the ridge, so it does the masking itself -- and it masks exactly,
   which a fade can only approximate. The weather shows through the gaps in the hatching
   because that is where the plate is genuinely open. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ the press */
  var PITCH = 5;            /* the ruling, in CSS pixels: the ruling at the labs */

  /* ---------------------------------------------------------------- the weather */
  var CLOUD = 0.013;        /* noise units to a CSS pixel: how big a cloud is */
  /* The two speeds are set against each other on purpose. Drift alone is a texture
     sliding behind a window, however fast it goes; churn alone is a field boiling in
     place. Measured in the same units -- WIND * CLOUD is the noise the field crosses in
     a second -- they are equal here, so the sky moves past AND remakes itself by the
     same amount, which is what weather does.

     A plate 320 across holds about four clouds. At these speeds one crosses it in
     fifteen seconds and remakes itself in three and a half -- about four cells of the
     grid a second.

     The speed was set by measuring, because the first pass was set by feel and was
     glacial: a cloud took over a minute to cross and the sky read as a still picture
     that happened to be repainting sixty times a second. What the eye reads as motion
     rather than as drift is what changes inside about a THIRD of a second, and at a
     third of a second the share of dots that visibly change size runs 5% at half this
     speed, 15% here, 20% at half again. Past this it stops being weather and starts
     competing with the button. */
  var CHURN = 0.286;        /* noise units a second: how fast a cloud remakes itself */
  var WIND = 22;            /* CSS pixels a second the deck is carried sideways */
  var LO = 0.50, HI = 0.80; /* the band of the field the dots are spent on */
  var WEAVE = 0.07;         /* the dot the clearest sky still gets, so the mesh reads */
  var OPEN = 0.80;          /* and the most the brightest cloud gets, so it never goes solid */

  var box, canvas, ctx;
  var running = false, raf = 0, t0 = 0, still = false;
  var w = 0, h = 0, cols = 0, rows = 0, ink = '#2d2a2a';

  /* -------------------------------------------------------------- the noise field */
  /* Value noise: a number at every corner of a lattice, smoothed between them. Cheaper
     than gradient noise and, under a screen this coarse, indistinguishable -- the dots
     are the texture, the field only has to say where they gather. */
  function hash(i, j, k) {
    var n = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1442695040);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function noise(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), e = zf * zf * (3 - 2 * zf);
    var a = hash(xi, yi, zi), b = hash(xi + 1, yi, zi);
    var c = hash(xi, yi + 1, zi), d = hash(xi + 1, yi + 1, zi);
    var f = hash(xi, yi, zi + 1), g = hash(xi + 1, yi, zi + 1);
    var p = hash(xi, yi + 1, zi + 1), q = hash(xi + 1, yi + 1, zi + 1);
    var lo = (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
    var hi = (f + (g - f) * u) + ((p + (q - p) * u) - (f + (g - f) * u)) * v;
    return lo + (hi - lo) * e;
  }

  /* Three octaves. The step is not quite two, so the octaves never line up again and
     the sky never repeats itself. */
  function fbm(x, y, z) {
    return (noise(x, y, z)
          + noise(x * 2.07, y * 2.07, z * 2.07) * 0.5
          + noise(x * 4.31, y * 4.31, z * 4.31) * 0.25) / 1.75;
  }

  /* ------------------------------------------------------------------ the plate */
  function fit() {
    var r = box.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cols = Math.ceil(w / PITCH); rows = Math.ceil(h / PITCH);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   /* struck in CSS pixels, printed in device ones */
    var v = getComputedStyle(document.documentElement).getPropertyValue('--quarry-950').trim();
    if (v) ink = v;
    return true;
  }

  function paint(now) {
    if (!running) return;
    if (!still) raf = requestAnimationFrame(paint);
    var t = (now - t0) / 1000;
    var drift = t * WIND, z = t * CHURN;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ink;
    ctx.beginPath();
    for (var r = 0; r < rows; r++) {
      var y = (r + 0.5) * PITCH;
      for (var c = 0; c < cols; c++) {
        var x = (c + 0.5) * PITCH;
        var tone = (fbm((x + drift) * CLOUD, y * CLOUD, z) - LO) / (HI - LO);
        if (tone < 0) tone = 0; else if (tone > 1) tone = 1;
        /* Clear sky is still printed sky. Spent across the whole band, the clearest
           cells come back empty and the plate is flat ember with a smudge on it: the
           weave never shows, and the weave is what makes it a print. The ceiling is the
           same argument at the other end: a cloud whose dots meet is a hole in the
           plate, and a hole is not a tone. */
        tone = WEAVE + tone * (OPEN - WEAVE);
        var side = Math.sqrt(tone) * PITCH;
        if (side < 0.3) continue;              /* under a third of a pixel is dirt, not a dot */
        ctx.rect(x - side / 2, y - side / 2, side, side);
      }
    }
    ctx.fill();                                /* every dot in one path: one fill a frame */
  }

  /* ------------------------------------------------------------------ the switch */
  function start() {
    box = document.querySelector('.ticket__pic');
    canvas = document.getElementById('arrival-sky');
    if (!box || !canvas || running) return;
    ctx = canvas.getContext('2d');
    if (!ctx || !fit()) return;
    /* The screen is not the motion -- the weather is. Under a reduced-motion setting the
       sky is printed once and stands. */
    still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    running = true;
    t0 = performance.now();
    raf = requestAnimationFrame(paint);
    window.addEventListener('resize', onResize);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  }

  function onResize() {
    if (!running) return;
    if (fit() && still) paint(performance.now());
  }

  window.ArrivalSky = { start: start, stop: stop };
})();
