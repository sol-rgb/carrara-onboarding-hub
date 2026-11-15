/* Idea 4 — the years in photos, under "Carrara in 2026", after mariavasilyeva.com.
   A strip of small photos runs across the middle of the page, every one of them in the order
   they were taken, 2024 to 2026. While the reader scrolls through it the page holds still
   (the stage is sticky) and a reading head travels across: the strip slides under it, and each
   photo grows as the head comes to it and shrinks as the head leaves, one after another. The
   head's place along the strip is the scroll's: halfway down, halfway along.
   The years' lines are the letter's own; the photos are in assets/cronologia/<year>/.
   The team can change the photos' order and take some out (the edit version, edit.js): that
   order is kept with the letter's edits (edits.json, read by app.js) and the strip is built
   from it; in the edit version it is built once the store is in, and again on each change. */

(function () {
  'use strict';

  var host = document.getElementById('cronologia');
  if (!host) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* On a phone a step of several paragraphs is a step to each, so each rises and fades on its
     own: from the second on, each goes into a step of its own after it, of the same year (a
     paragraph and its list stay together) */
  if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
    [].forEach.call(host.parentNode.querySelectorAll('.cronologia-paso:not(.cronologia-paso--fijo)'), function (paso) {
      var parrafos = [].slice.call(paso.querySelectorAll(':scope > .cronologia-paso__texto > p'));
      var despues = paso;
      parrafos.slice(1).forEach(function (p) {
        var otro = document.createElement('div');
        otro.className = 'cronologia-paso';
        otro.dataset.año = paso.dataset.año;
        var texto = document.createElement('div');
        texto.className = 'cronologia-paso__texto';
        var siguiente = p.nextElementSibling;
        texto.appendChild(p);
        while (siguiente && siguiente.tagName !== 'P') { var n = siguiente.nextElementSibling; texto.appendChild(siguiente); siguiente = n; }   /* its list with it */
        otro.appendChild(texto);
        despues.parentNode.insertBefore(otro, despues.nextSibling);
        despues = otro;
      });
    });
    /* and 2026 too: its first line holds all through the year, and under it each game is a step
       of its own, one box at a time, fading in and out like the rest; the last one stays, the
       line over it too, till the photos let go, so the page is never left dark and empty */
    [].forEach.call(host.parentNode.querySelectorAll('.cronologia-paso--fijo'), function (paso) {
      var juegos = paso.querySelector(':scope > .juegos');
      paso.classList.remove('cronologia-paso--fijo');
      paso.classList.add('cronologia-paso--sobre');
      [].forEach.call(paso.querySelectorAll(':scope > .cronologia-subpaso'), function (sub) { sub.remove(); });
      if (!juegos) return;
      [].slice.call(juegos.children).forEach(function (juego) {
        var otro = document.createElement('div');
        otro.className = 'cronologia-paso cronologia-paso--juego';
        otro.dataset.año = paso.dataset.año;
        juego.classList.add('cronologia-paso__texto', 'juego--solo');
        otro.appendChild(juego);
        paso.appendChild(otro);   /* inside the line's step, so the line holds over every one of them */
      });
      paso.lastElementChild.classList.add('cronologia-paso--queda');
      juegos.remove();
    });
  }

  /* [name, width, height] of each photo, as made for the page */
  var AÑOS = [
    { año: '2024', linea: 'We might have a game.', fotos: [
      ['05-loft-plants', 1100, 729], ['02-crowd-painting', 1100, 735], ['04-crowd-green-jacket', 1100, 727],
      ['EEB00261', 733, 1100], ['EEB00411', 733, 1100], ['EEB00443', 1100, 734], ['EEB00516', 1100, 734],
      ['EEB00617', 1100, 734], ['EEB00755', 733, 1100], ['EEB00793', 733, 1100], ['03-artist-painting', 724, 1100],
      ['01-speaker-mic', 1100, 727], ['EEB00897', 1100, 734], ['EEB00900', 1100, 734], ['EEB00919', 1100, 734],
      ['EEB00924', 1100, 734]] },
    { año: '2025', linea: 'Wow, this game is fun.', fotos: [
      ['18255F17', 1100, 825], ['BBCAFFC1', 1100, 825], ['9B3A5F6B', 1100, 825], ['DC56C58D', 1100, 825], ['7E78EB10', 1100, 825],
      ['IMG_1296', 1100, 825], ['IMG_1297', 1100, 825], ['IMG_1299', 1100, 825], ['IMG_1300', 1100, 825], ['IMG_1307', 1100, 825],
      ['IMG_5982', 825, 1100], ['IMG_5988', 825, 1100], ['IMG_5993', 825, 1100], ['IMG_5997', 825, 1100],
      ['IMG_6009', 825, 1100], ['IMG_6035', 825, 1100], ['IMG_6051', 825, 1100], ['IMG_6075', 825, 1100],
      ['IMG_6087', 825, 1100], ['IMG_6089', 825, 1100], ['IMG_6125', 1100, 825], ['IMG_6128', 1100, 825],
      ['IMG_6129', 1100, 825], ['IMG_6130', 1100, 825], ['IMG_6131', 1100, 825], ['1D052F5B', 825, 1100]] },
    { año: '2026', linea: 'Let’s play bigger games.', fotos: [
      ['000027450001', 1100, 729], ['000027450002', 729, 1100], ['000027450006', 1100, 729], ['000027450007', 1100, 729], ['000027450009', 729, 1100], ['000027460021', 729, 1100],
      ['100619', 1100, 729], ['10081', 1100, 729], ['100811', 1100, 729], ['100822', 1100, 729],
      ['10086', 729, 1100], ['10088', 1100, 729], ['87810007', 1100, 729], ['87810015', 729, 1100], ['87810019', 1100, 729],
      ['87810027', 1100, 729], ['87820012', 1100, 729], ['87820026', 1100, 729], ['87830010', 1100, 729],
      ['87830017', 1100, 729], ['87830018', 1100, 729], ['87840026', 1100, 729], ['87850021', 1100, 729],
      ['87860016', 729, 1100], ['87860019', 1100, 729], ['87870002', 1100, 729], ['87870013', 1100, 729], ['87870026', 1100, 729]] }
  ];

  /* the photos as the team ordered them: for each year, the names in order and the names taken
     out; one added to the page since goes at the end of its year, so it is never lost */
  function ordenar(orden) {
    return AÑOS.map(function (y) {
      var o = orden && orden[y.año];
      if (!o) return y;
      var porNombre = {}, fuera = {}, puestas = {};
      y.fotos.forEach(function (f) { porNombre[f[0]] = f; });
      (o.fuera || []).forEach(function (n) { fuera[n] = true; });
      var fotos = (o.orden || []).map(function (n) { return porNombre[n]; }).filter(function (f) { return f && !fuera[f[0]]; });
      fotos.forEach(function (f) { puestas[f[0]] = true; });
      y.fotos.forEach(function (f) { if (!puestas[f[0]] && !fuera[f[0]]) fotos.push(f); });
      return { año: y.año, linea: y.linea, fotos: fotos };
    });
  }

  var MINI = 40;          /* the strip's photos, how high */
  var HUECO = 4;          /* and the room between them */
  var MARGEN = 0.12;      /* the head travels from this far in on the left to as far in on the right */
  var APAISADA = 1.3;     /* a photo at its largest fills the stage's height, as long as it is no wider than this many times that height */

  var src = function (a, f) { return '/assets/cronologia/' + a + '/' + f[0] + '.jpg'; };
  var el = function (tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };

  /* the strip, built from the photos in the order given (none: the code's); built again, it
     takes the last one down first */
  var vivo = null;   /* the build in place: what the scroll and the window's size reach */
  function armar(orden) {
  var años = ordenar(orden);
  window.CronologiaAños = años;   /* the weird page gives each its emoji (unicode.js) */
  host.textContent = '';
  [].forEach.call(host.parentNode.querySelectorAll('.juego__caja'), function (c) { c.remove(); });
  vivo = null;

  /* a seeded hand, so the photos open out the same way every time */
  var seed = 11;
  var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  /* ---------------------------------------------------------------- without motion: the years one under the other */
  if (reduced) {
    host.classList.add('is-quieta');
    años.forEach(function (y) {
      var bloque = el('div', 'cronologia__año', host);
      el('p', 'cronologia__titulo', bloque).textContent = y.año + ': ' + y.linea;
      var fila = el('div', 'cronologia__fila', bloque);
      y.fotos.forEach(function (f) { var i = el('img', '', fila); i.src = src(y.año, f); i.alt = ''; i.loading = 'lazy'; });
    });
    return;
  }

  /* ---------------------------------------------------------------- the stage */
  var escena = el('div', 'cronologia__escena', host);
  var capa = el('div', 'cronologia__capa', escena);
  /* the head runs from the line of time up past the stage, to a label over the photos'
     reach: the year being read, as the letter's line for it has it */
  var cabezal = el('div', 'cronologia__cabezal', host);
  var cabezalSobre = el('div', 'cronologia__cabezal-sobre', capa);   /* its faint copy, over the photos, inside the stage */
  var rotulo = el('p', 'cronologia__rotulo', cabezal);
  var actual = -1, primero = true;   /* the first label is just set; it rolls from then on */
  /* in two lines: the year, then its line (a label: no full stop). When the year changes
     the label fades out and the new one fades in, in the same place, so the change is seen */
  var lineas = [el('span', 'cronologia__linea', rotulo), el('span', 'cronologia__linea', rotulo)];
  var SALE = 280, ENTRA = 420, PAUSA = 120;   /* out, a breath, in */
  var anchoRotulo = null;   /* the year's label's width, measured once it changes (leer) */
  function rotular(y, rueda) {
    [y.año, y.linea.replace(/\.$/, '')].forEach(function (t, i) {
      var linea = lineas[i];
      /* a fade still going is finished at once, so only the last words stay */
      [].slice.call(linea.children).forEach(function (v) {
        if (v.classList.contains('is-saliendo')) linea.removeChild(v);
        else v.getAnimations().forEach(function (a) { a.finish(); });
      });
      var viejo = linea.firstElementChild, nuevo = el('span', '', linea);
      nuevo.textContent = t;
      anchoRotulo = null;
      if (!rueda || !viejo) { if (viejo) linea.removeChild(viejo); return; }
      viejo.classList.add('is-saliendo');
      viejo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SALE, easing: 'ease-in', fill: 'both' })
        .onfinish = function () { if (viejo.parentNode) linea.removeChild(viejo); anchoRotulo = null; };
      nuevo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ENTRA, delay: SALE + PAUSA, easing: 'ease-out', fill: 'both' })
        .onfinish = function (e) { e.target.cancel(); };
    });
  }

  /* Every photo is one piece, on the strip in order, each year marked where it starts. As the
     head comes near a photo it grows, and leaves the line, up or down, to a place of its own;
     at the head it is at its largest; as the head goes on it shrinks back into the line. So
     the photos open out one by one, as a wave that travels with the head, never a year at once. */
  var fotos = [], inicios = [], x = 0;
  años.forEach(function (y, yi) {
    inicios.push(x);
    y.fotos.forEach(function (f, fi) {
      var ancho = MINI * f[1] / f[2];
      var d = el('div', 'cronologia__foto', capa);
      var img = el('img', '', d);
      img.src = src(y.año, f); img.alt = ''; img.loading = 'lazy';
      fotos.push({
        el: d, año: yi, x: x + ancho / 2, pw: f[1], ph: f[2],
        talla: 0.4 + rnd() * 0.1,                                            /* how big it opens out, of its largest: only the one at the head is at full size */
        lado: (fotos.length % 2 ? 1 : -1) * (rnd() < 0.2 ? -1 : 1),          /* up or down, mostly in turn */
        alto: Math.pow(rnd(), 2) * 0.36,                                   /* how far off the line, of the stage's height: from on it to well away, most of them near, so the middle fills too */
        corre: (rnd() - 0.5) * 120                                          /* and a little to one side */
      });
      x += ancho + HUECO;
    });
    x += HUECO * 6;   /* a little more room between one year and the next */
  });
  var LARGO = x - HUECO * 7;
  inicios.push(LARGO);   /* where the last year ends, and the next would start */

  /* The line of time is drawn as a C4 scale of the trazos system, by hand: a short tick every
     PASO px all along it, whatever the years, and a long one where each year starts. It is laid in the strip's own measure, so it travels with it; it comes in
     from past the window's left edge and, a little after the last photo, ends in an arrow
     (F1): time goes on. */
  var sobre = null;
  var T = window.Trazos, escala = null, ESC_Y = 12, PASO = 16, CORTO = 4, LARGA = 9;   /* ticks cross the line, up and down */
  function trazarEscala(W) {
    if (!T || !T.svg || !T.escala) return;
    if (escala) escala.remove();
    var ancho = LARGO + 2 * W, alto = 64;
    escala = T.svg(capa, ancho, alto);   /* in the photos' own layer, over all of them */
    escala.classList.add('cronologia__escala');
    escala.setAttribute('viewBox', (-W) + ' 0 ' + ancho + ' ' + alto);
    escala.style.width = ancho + 'px'; escala.style.height = alto + 'px';
    var g = T.el('g', { class: 'c4' }, escala);
    var FIN = LARGO + 96;   /* where the arrow ends, a little past the last photo */
    /* Drawn by hand, as the drawings are: the pen of a drawing works over the whole of it, and
       this one is thousands of px long, too long for the pen to take; so the line is laid in
       stretches of TRAMO px, end to end, each with its ticks and its own pen over its own box */
    var TRAMO = 640, tramos = [];
    var tramoDe = function (x) {
      var i = Math.floor((x + W) / TRAMO);
      return tramos[i] || (tramos[i] = T.el('g', { class: 'cronologia__tramo' }, g));
    };
    for (var x = -W; x < FIN; x += TRAMO) {
      var x2 = Math.min(x + TRAMO, FIN);
      T.el('line', { x1: x, y1: ESC_Y, x2: x2, y2: ESC_Y, class: 'l2 vectorial' + (x2 === FIN ? ' f1' : '') }, tramoDe(x));
    }
    /* the short ticks, every PASO px, counted from the strip's start so they never shift,
       stopping short of the arrow */
    for (var tx = -Math.floor(W / PASO) * PASO; tx <= FIN - 24; tx += PASO) {
      T.el('line', { x1: tx, y1: ESC_Y - CORTO, x2: tx, y2: ESC_Y + CORTO, class: 'l7 vectorial' }, tramoDe(tx));
    }
    /* the long ones, where each year starts; the years themselves are not written on the line
       (the stage's foot names the one being read) */
    inicios.forEach(function (x0, i) {
      if (i >= años.length) return;   /* no year after the last: the arrow goes on */
      T.el('line', { x1: x0, y1: ESC_Y - LARGA, x2: x0, y2: ESC_Y + LARGA, class: 'l2 vectorial' }, tramoDe(x0));
    });
    var hecha = escala;
    plumaPorTramo(hecha, tramos.filter(Boolean), function () {
      if (hecha !== escala) return;   /* drawn again since */
      /* a faint copy of the whole scale, over every photo: it is what shows over the one passing */
      if (sobre) sobre.remove();
      sobre = escala.cloneNode(true);
      sobre.classList.add('cronologia__escala--sobre');
      capa.appendChild(sobre);
      leer();
    });
  }
  /* each stretch its own copy of the drawing's fine pen, over its own box, kept with the
     drawing's (svg._boli) so the trazos still set it to the screen; the drawing's pens come
     once it has been laid out, so it waits for them */
  function plumaPorTramo(svg, grupos, listo) {
    var plumas = svg._boli;
    if (!plumas) { if (svg.isConnected) requestAnimationFrame(function () { plumaPorTramo(svg, grupos, listo); }); return; }
    var fino = plumas[1];
    grupos.forEach(function (gr, i) {
      var b = gr.getBBox(), c = fino.cloneNode(true);
      c.id = fino.id + '-tramo-' + i;
      c.setAttribute('x', b.x - 16); c.setAttribute('y', b.y - 16);
      c.setAttribute('width', b.width + 32); c.setAttribute('height', b.height + 32);
      fino.parentNode.appendChild(c);
      plumas.push(c);
      gr.style.filter = 'url(#' + c.id + ')';
    });
    listo();
  }

  /* the head, drawn by hand too: a line in its own small drawing, with the pen, as tall as
     the head is (it is drawn again when that changes) */
  function trazarCabezal(div, alto) {
    if (!T || !T.svg) return;
    var vieja = div.querySelector('.cronologia__trazo');
    if (vieja) vieja.remove();
    var s = T.svg(div, 4, alto);
    s.classList.add('cronologia__trazo');
    s.style.width = '4px'; s.style.height = alto + 'px';
    T.el('line', { x1: 2, y1: 0, x2: 2, y2: alto, class: 'l2' }, s);
  }

  /* ---------------------------------------------------------------- reading the scroll */
  var W = 0, H = 0;
  var ONDA = 0.17;   /* how far either side of the head the wave reaches, of the stage's width */
  var PASA = 34;     /* and how near the head a photo has to be to be the one passing it */
  var ORILLA = 16;   /* the frame's mat */

  /* The figure holds the top of the screen (style.css) while the text after it goes by, the
     stretch it sits in (.cronologia-tramo): the head's way across is the reader's way through
     that text, from when the figure takes the top to when the stretch lets it go. */
  var tramo = host.parentNode;
  /* the text it reads: each paragraph carries its year (data-año). Each year's paragraphs,
     from the top of the first to the foot of the last, are that year's stretch of reading */
  var tramos = [], LECTURA = 64;   /* the line the reader is reading at: this far below the stage */
  var ARRIBA = 0;     /* the room over the stage for the label (the figure's padding-top, style.css) */
  var ASOMA = 8;      /* how far the head starts over the stage */
  function medirTexto() {
    var t0 = tramo.getBoundingClientRect().top;
    tramos = años.map(function (y) {
      var ps = tramo.querySelectorAll('[data-año="' + y.año + '"]');
      if (!ps.length) return null;
      return { a: ps[0].getBoundingClientRect().top - t0, b: ps[ps.length - 1].getBoundingClientRect().bottom - t0 };
    });
    /* the last year's stretch runs on to where the figure lets go, so its photos are not
       rushed through a single paragraph */
    var ultimo = null;
    tramos.forEach(function (t) { if (t) ultimo = t; });
    var debajo = parseFloat(getComputedStyle(host).marginBottom) || 0;
    var fin = ARRIBA + LECTURA + H + (tramo.offsetHeight - host.offsetHeight - debajo);   /* where the reading is when the figure lets go */
    if (ultimo) ultimo.b = Math.max(ultimo.b, fin - 8);
  }
  function medir() {
    W = escena.clientWidth; H = escena.clientHeight;
    /* each photo is laid at its largest, the size it has at the head, and scaled down from there */
    fotos.forEach(function (f) {
      var k = Math.min(H / f.ph, H * APAISADA / f.pw, (W - 2 * ORILLA) / f.pw);   /* and never wider than the stage, on a phone */
      f.bw = f.pw * k; f.bh = f.ph * k;
      f.mini = MINI / f.bh;   /* its scale on the strip */
      f.el.style.width = f.bw + 'px'; f.el.style.height = f.bh + 'px';
    });
    ARRIBA = parseFloat(getComputedStyle(host).paddingTop) || 0;
    /* the photos reach the stage's top edge, so the head runs from a little under the line of
       time up past the stage, into the room over it, to its label there */
    cabezal.style.top = (ARRIBA - ASOMA) + 'px';
    cabezal.style.height = (H / 2 + 16 + ASOMA) + 'px';
    cabezalSobre.style.top = '0px';
    cabezalSobre.style.height = (H / 2 + 16) + 'px';
    trazarCabezal(cabezal, H / 2 + 16 + ASOMA);
    trazarCabezal(cabezalSobre, H / 2 + 16);
    tramo.style.setProperty('--lectura', (ARRIBA + LECTURA + H) + 'px');   /* where the text's steps hold: the reading line */
    trazarCajas();
    medirTexto();
    trazarEscala(W);
    leer();
  }

  /* the text's steps: each fades in as it rises to the reading line and out as it leaves it,
     over FUNDE of its run either side. One too tall to fit under the line holds higher, as
     high as it needs to end AIRE over the window's foot, but never nearer the photos' paper
     than AIRE */
  /* A step can hold one line over steps of its own (2026: its first line, and under it the
     games, a box each, one laid over the other as their empty steps go by) */
  var pasos = [];
  [].forEach.call(tramo.querySelectorAll('.cronologia-paso'), function (el) {
    var paso = { el: el, texto: el.querySelector(':scope > .cronologia-paso__texto'), juegos: el.querySelector(':scope > .juegos') };
    pasos.push(paso);
    [].forEach.call(el.querySelectorAll(':scope > .cronologia-subpaso'), function (sub, i) {
      var s = { el: sub, texto: paso.juegos.children[i], bajo: paso };
      pasos.push(s);
      paso.ultimo = s;   /* the held line goes with the last of those under it */
    });
  });
  /* a phone's 2026: the line over the games alone in their steps, and each of those under it */
  pasos.forEach(function (p) {
    if (!p.el.classList.contains('cronologia-paso--juego')) return;
    pasos.forEach(function (q) { if (q.el === p.el.parentNode) { p.sobre = q; (q.solos = q.solos || []).push(p); } });
  });
  var FUNDE = 0.12, AIRE = 16, ENTRE = 16;
  /* a game's box: each DESPLAZA under the one before, so the name of every one stays in view,
     all as wide, each as tall as its words, its line a small drawing, there from the start; and
     how far under its place it starts, rising in as it fades in */
  var DESPLAZA = 44, SUBE = 28;
  function trazarCajas() {
    if (!T || !T.svg) return;   /* the letter also guarded on T.secuencia (motion.js); nothing here animates */
    /* a game alone in its step (a phone): its box as wide as the column, as tall as its words */
    pasos.forEach(function (p) {
      if (!p.texto || !p.texto.classList.contains('juego--solo')) return;
      if (p.marco) p.marco.remove();
      var ancho = Math.round(p.texto.clientWidth), alto = Math.ceil(p.texto.offsetHeight);
      var svg = T.svg(p.texto, ancho, alto);
      svg.classList.add('juego__caja');
      svg.style.width = ancho + 'px'; svg.style.height = alto + 'px';
      T.el('rect', { x: 1, y: 1, width: ancho - 2, height: alto - 2, class: 'l2', fill: 'none' }, svg);
      p.marco = svg;
    });
    pasos.forEach(function (paso) {
      if (!paso.juegos) return;
      var cajas = pasos.filter(function (p) { return p.bajo === paso; });
      var ancho = Math.round(paso.juegos.clientWidth), pila = 0;
      cajas.forEach(function (p, i) {
        p.texto.style.width = ancho + 'px';
        p.texto.style.left = '0px';
        p.texto.style.top = (i * DESPLAZA) + 'px';
        if (p.caja) p.caja.svg.remove();
        pila = Math.max(pila, i * DESPLAZA + Math.ceil(p.texto.offsetHeight));
      });
      paso.juegos.style.height = pila + 'px';
      paso.juegos.style.marginBottom = -pila + 'px';
      cajas.forEach(function (p) {
        var alto = Math.ceil(p.texto.offsetHeight);
        var svg = T.svg(p.texto, ancho, alto);
        svg.classList.add('juego__caja');
        svg.style.width = ancho + 'px'; svg.style.height = alto + 'px';
        T.el('rect', { x: 1, y: 1, width: ancho - 2, height: alto - 2, class: 'l2', fill: 'none' }, svg);
        p.caja = { svg: svg };
      });
    });
  }
  function fundir() {
    var techo = host.offsetHeight + AIRE, antes = null;
    pasos.forEach(function (p) {
      if (!p.texto) return;
      var pila = p.bajo ? p.bajo.juegos : p.juegos;   /* the boxes under a held line go as one: they hold as one, and the room they take is theirs */
      var h = p.bajo ? pila.offsetHeight : p.texto.offsetHeight + (pila ? ENTRE + pila.offsetHeight : 0);
      if (p.solos) h += ENTRE + Math.max.apply(null, p.solos.map(function (q) { return q.texto.offsetHeight; }));   /* the line and its tallest game hold centred as one */
      /* a step holds centred in the room under the photos (with its boxes, as one), never nearer them than AIRE */
      var alto = p.bajo ? p.bajo.alto + p.bajo.texto.offsetHeight + ENTRE
        : p.sobre ? p.sobre.alto + p.sobre.texto.offsetHeight + ENTRE   /* a game 16 under the line it goes with */
        : Math.max(techo, Math.round(host.offsetHeight + (window.innerHeight - host.offsetHeight - h) / 2));
      if (p.alto !== alto) { p.alto = alto; (p.bajo ? pila : p.texto).style.top = alto + 'px'; }
      /* the line over the games lets go as far over the stretch's end as its last game takes,
         so the two leave together, the game still under it (the first game's step pulled up as much) */
      if (p.solos) {
        var deja = ENTRE + p.solos[p.solos.length - 1].texto.offsetHeight;
        if (p.deja !== deja) { p.deja = deja; p.texto.style.marginBottom = deja + 'px'; p.solos[0].el.style.marginTop = -deja + 'px'; }
      }
      /* taller than the room under the photos: it does not hold, it is read as it goes by */
      var quieto = p.bajo ? p.bajo.quieto : p.sobre ? p.sobre.quieto : h <= window.innerHeight - techo - AIRE;
      if (p.quieto !== quieto) {
        p.quieto = quieto;
        if (!p.bajo) { p.texto.style.position = quieto ? '' : 'static'; if (pila) pila.classList.toggle('juegos--corrido', !quieto); }
      }
      var r = p.el.getBoundingClientRect(), run = Math.max(1, r.height - h);
      if (p.solos) run = Math.min(run, window.innerHeight * 0.6);   /* the line over the games fades in as a step does, not over the whole year */
      var u = (alto - r.top) / run;
      var llega = (u + FUNDE) / (2 * FUNDE), sale = (1 + FUNDE - u) / (2 * FUNDE);
      if (pila || p.solos || p.el.classList.contains('cronologia-paso--queda')) sale = Infinity;   /* a box stays once it has come, and the line over them with it, till the last has gone by; the last game alone (a phone) stays till the photos let go */
      var o = quieto ? Math.max(0, Math.min(1, llega, sale)) : 1;   /* one that goes by is read whole; the photos' paper covers it as it goes */
      if (p.bajo && p.bajo.ultimo === p) {   /* with the last one gone by, the line and the boxes fade out, at once, before they move on */
        var fuera = quieto ? Math.max(0, Math.min(1, (1 - u) / (2 * FUNDE))) : 1;
        pila.style.opacity = fuera.toFixed(3);
        if (quieto) p.bajo.texto.style.opacity = Math.min(+p.bajo.texto.style.opacity, fuera).toFixed(3);
      }
      p.texto.style.opacity = o.toFixed(3);
      if (p.caja) {
        p.texto.style.transform = 'translateY(' + ((1 - o) * SUBE).toFixed(1) + 'px)';
        /* the sentence of the box under it gives way, so the two are never read through each other;
           read in a row (the window too low to hold them), every sentence stays */
        if (antes) antes.texto.querySelector('p:last-of-type').style.opacity = quieto ? (1 - o).toFixed(3) : '1';
        antes = p;
      }
    });
  }

  /* where its stretch lies on the page, kept so a scroll far from it costs nothing: there it only
     makes sure the page is not dark (measured again whenever the page changes height) */
  var zona = null;
  /* the page turns dark while the figure holds the top. The hub has one switch for that --
     the theme -- so this sets it and remembers what the page was on, to put back after. */
  var raiz = document.documentElement, temaAntes = null, oscuro = false;
  function oscurecer(on) {
    if (on === oscuro) return;
    oscuro = on;
    if (on) {
      temaAntes = raiz.getAttribute('data-theme');
      raiz.setAttribute('data-theme', 'dark');
    } else if (temaAntes === null) raiz.removeAttribute('data-theme');
    else raiz.setAttribute('data-theme', temaAntes);
  }
  function medirZona() { var r = tramo.getBoundingClientRect(); zona = { a: r.top + window.scrollY, b: r.bottom + window.scrollY }; }
  function leer() {
    if (!zona) medirZona();
    var vh = window.innerHeight;
    if (window.scrollY + 2 * vh < zona.a || window.scrollY - vh > zona.b) {
      oscurecer(false);
      if (host.classList.contains('is-cerca')) host.classList.remove('is-cerca');   /* its photos give up their layers (style.css) */
      return;
    }
    if (!host.classList.contains('is-cerca')) host.classList.add('is-cerca');
    fundir();
    var r = tramo.getBoundingClientRect(), cs = getComputedStyle(host);
    var arriba = parseFloat(cs.top) || 0, debajo = parseFloat(cs.marginBottom) || 0;
    var recorrido = tramo.offsetHeight - host.offsetHeight - debajo;   /* how far the figure stays held */
    var p = Math.max(0, Math.min(1, (arriba - r.top) / (recorrido || 1)));
    /* the page goes dark while the figure holds the top, and a little before it gets there */
    oscurecer(r.top < window.innerHeight * 0.5 && r.bottom > host.offsetHeight + debajo);
    /* where the reading is, in the strip's measure. Each year's photos start where its text
       starts and run on, without ever stopping, to where the next year's text starts: so the
       photos go slower through a long year of text and faster through a short one */
    var y = ARRIBA + LECTURA + H - r.top, s = 0, año = 0;
    var marcas = [];
    tramos.forEach(function (t, i) { if (t) marcas.push({ y: t.a, s: inicios[i], año: i }); });
    var ult = null;
    tramos.forEach(function (t) { if (t) ult = t; });
    if (ult) marcas.push({ y: ult.b, s: LARGO, año: marcas[marcas.length - 1].año });
    if (marcas.length < 2) s = p * LARGO;   /* no year in the text: by the scroll alone */
    else if (y <= marcas[0].y) { s = 0; año = marcas[0].año; }
    else if (y >= marcas[marcas.length - 1].y) { s = LARGO; año = marcas[marcas.length - 1].año; }
    else {
      for (var i = 0; i < marcas.length - 1; i++) {
        var a = marcas[i], b = marcas[i + 1];
        if (y < b.y) { s = a.s + (y - a.y) / ((b.y - a.y) || 1) * (b.s - a.s); año = a.año; break; }
      }
    }
    var m = W * MARGEN, cx = m + (s / LARGO) * (W - 2 * m), base = cx - s;
    var mitad = H / 2, onda = W * ONDA;
    var linea = mitad;   /* the line of time runs through the middle of the strip */
    cabezal.style.transform = 'translateX(' + cx.toFixed(1) + 'px)';
    if (escala) escala.style.transform = 'translate(' + (base - W).toFixed(1) + 'px, ' + (linea - ESC_Y) + 'px)';

    var heroe = null, heroeB = 0;
    fotos.forEach(function (f) {
      var fx = base + f.x, d = fx - cx;
      var g = Math.exp(-(d * d) / (2 * onda * onda));                /* 1 at the head, falling away either side */
      var e = g * g * (3 - 2 * g);                                   /* eased, so it leaves the line softly */
      var k = f.mini + (f.talla - f.mini) * e;                       /* from its size on the strip to its own */
      /* the photo the head is passing grows to its largest, and comes to the line, over the rest */
      var b = Math.exp(-(d * d) / (2 * PASA * PASA));
      k += (1 - k) * b;
      var px = fx + f.corre * e * (1 - b), py = mitad + f.lado * f.alto * H * e * (1 - b);
      /* the whole photo always shows: it stays inside the stage, and an open one inside the window */
      var mw = f.bw * k / 2, mh = f.bh * k / 2;
      py = Math.max(mh, Math.min(H - mh, py));
      px += (Math.max(ORILLA + mw, Math.min(W - ORILLA - mw, px)) - px) * Math.min(1, e * 4);
      /* off the stage's sides (clipped there anyway) it is left as it is, hidden, and not painted */
      var fuera = px + mw < -40 || px - mw > W + 40;
      if (fuera) { if (!f.fuera) { f.fuera = true; f.el.style.visibility = 'hidden'; } return; }
      f.el.style.transform = 'translate(' + (px - f.bw / 2).toFixed(1) + 'px, ' + (py - f.bh / 2).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
      f.el.style.zIndex = Math.round(e * 100 + b * 100);
      if (b > heroeB) { heroeB = b; heroe = f; }
      f.el.classList.toggle('is-lejos', e < 0.04);
      if (f.fuera) { f.fuera = false; f.el.style.visibility = ''; }
    });
    /* the one passing the head, and only that one, lies over the lines (the scale, 300, and the
       head behind the stage); over it they show again faint, so they read without spoiling it */
    if (heroe && heroeB > 0.05) heroe.el.style.zIndex = 400;
    if (sobre) sobre.style.transform = escala.style.transform;
    cabezalSobre.style.transform = 'translateX(' + cx.toFixed(1) + 'px)';

    /* the label names the year being read, centred under the head, and kept whole in the window */
    if (año !== actual) {
      actual = año;
      rotular(años[actual], primero === false);
      primero = false;
    }
    if (anchoRotulo === null) anchoRotulo = rotulo.offsetWidth;   /* read once a year, not every frame (a read after the writes above lays the page out again) */
    var w = anchoRotulo, izq = cx - w / 2, corre = Math.max(16, Math.min(W - 16 - w, izq)) - izq;
    rotulo.style.transform = 'translateX(' + (-w / 2 + corre).toFixed(1) + 'px)';

  }

  /* a phone's toolbar coming and going resizes the window as the page scrolls; the stage is in
     svh and does not change with it, so then only the text is measured again, not the strip */
  window.CronologiaSuelta = function () { if (!host.offsetParent) oscurecer(false); };
  vivo = { leer: leer, medir: function () { zona = null; anchoRotulo = null; if (escena.clientWidth === W && escena.clientHeight === H) { medirTexto(); leer(); return; } medir(); } };
  if (window.ResizeObserver) {
    new ResizeObserver(function () { zona = null; }).observe(document.body);
    /* the view this lives in is hidden until its hash is on: measure when it gets a size */
    var ancho = 0;
    new ResizeObserver(function () {
      var w = escena.clientWidth;
      if (w === ancho) return;
      ancho = w;
      /* the view was switched away from: a page that is not on screen does not hold the
         page dark, and nothing scrolls to tell us so */
      if (!w) { oscurecer(false); return; }
      if (vivo) vivo.medir();
    }).observe(escena);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (vivo && vivo.medir === medir) medir(); });   /* the text's measure settles with its fonts */
  medir();
  }

  /* The hub is one page of many and the stage only lives on one of them. Leaving that page
     neither scrolls nor repaints, so nothing would tell the stretch it is over: the hash says
     so. (The page turning dark is the stretch's, not the hub's -- it has no theme switch of
     its own.) */
  window.addEventListener('hashchange', function () {
    if (window.CronologiaSuelta) window.CronologiaSuelta();
  });

  var pedido = false;
  window.addEventListener('scroll', function () {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; if (vivo) vivo.leer(); });
  }, { passive: true });
  var tResize = 0;
  window.addEventListener('resize', function () {
    if (!vivo) return;
    vivo.leer();
    clearTimeout(tResize);
    tResize = setTimeout(function () { if (vivo) vivo.medir(); }, 150);
  });

  window.Cronologia = { años: AÑOS, ordenar: ordenar, armar: armar };
  /* the letter builds it with the order its edits hold (app.js reads edits.json first); the
     edit version builds it itself, from the store (edit.js) */
  armar();
})();
