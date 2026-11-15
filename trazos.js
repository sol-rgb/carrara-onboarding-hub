/* ======================================================================
   trazos.js — graphics-v6 · lo que el CSS no puede: los remates (markers),
   los patrones de relleno y las cotas, que necesitan geometría.
   Expone window.Trazos. Usa las clases de trazos.css (ver la tabla ahí).

     Trazos.defs()                        inyecta markers y patrones una vez por página
     Trazos.boligrafo({temblor, presion, grano…})  regula el trazo de birome
     Trazos.tamanoRemates(k, cual?)       escala los remates (todos o uno: 'f1'…'f5')
     Trazos.svg(host, w, h)               <svg class="tec" viewBox="0 0 w h">
     Trazos.el(tag, attrs, parent)        crea un elemento SVG
     Trazos.texto(parent, x, y, str, cls) <text>
     Trazos.punto(parent, x, y, tipo, tam, cls)  P1–P3 (tam: chica · normal · grande · extra)
     Trazos.cruz(parent, x, y, tam, cls)  P4
     Trazos.diana(parent, x, y, tam, cls) P5
     Trazos.tamanoPuntos(k)               escala todos los puntos
     Trazos.cota(parent, o)               C1 · cota entre dos puntos
     Trazos.llave(parent, o)              C2 · llave que abarca un tramo
     Trazos.nota(parent, o)               C3 · nota con línea de referencia
     Trazos.escala(parent, o)             C4 · ticks a lo largo de un segmento
     Trazos.eje(parent, o)                C5 · eje con flecha y etiqueta
     Trazos.dibujar(el, o)                anima el trazo (stroke-dasharray)
   ====================================================================== */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const svg = (host, w, h) => {
    const n = el("svg", { class: "tec", viewBox: `0 0 ${w} ${h}`, "aria-hidden": "true" }, host);
    if (vigilar) vigilar.observe(n); // cada gráfico con su bolígrafo a escala (ver ajustarFiltro)
    return n;
  };
  const texto = (parent, x, y, str, cls = "t1", attrs = {}) => {
    const t = el("text", { x, y, class: cls, ...attrs }, parent);
    t.textContent = str; return t;
  };
  const f = (v) => +(+v).toFixed(2);

  /* ---------- defs: remates y patrones ----------
     Los markers toman el color de la línea (context-stroke). Los patrones no
     pueden, así que hay uno por color: tz-r2-ink, tz-r2-gris, tz-r2-ember… */
  const COLORES = ["ink", "gris", "ember", "suave"];
  const COLOR = (c) => `var(--tz-${c})`;
  /* ---------- remates y sus tamaños ---------- */
  const TAMANOS = { chica: 0.7, normal: 1, grande: 1.5, extra: 2.2 };
  const TRAZO_REMATE = 1.25; // grosor de las barbas de F2 y F3, igual que una L2
  // Los remates se pintan con la tinta exacta de su línea: hay un juego por tinta
  // (tz-f1-ink, tz-f1-gris…) y cada color de línea elige el suyo (ver trazos.css, --tz-f1).
  // `p(prop)` devuelve el atributo de color: un style con la tinta, o context-stroke de reserva.
  const REMATES = {
    // F1 flecha cerrada: triángulo lleno
    f1: { w: 12, h: 10, refX: 11, refY: 5, dibujo: (m, p) => el("path", { d: "M0,0.5 L11,5 L0,9.5 Z", stroke: "none", ...p("fill") }, m) },
    // F2 flecha abierta: dos barbas
    f2: { w: 12, h: 12, refX: 11, refY: 6, barba: true, dibujo: (m, p) => el("path", { d: "M1,1 L11,6 L1,11", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", ...p("stroke") }, m) },
    // F3 tick: una barra perpendicular (cotas)
    f3: { w: 4, h: 10, refX: 2, refY: 5, barba: true, dibujo: (m, p) => el("line", { x1: 2, y1: 0, x2: 2, y2: 10, ...p("stroke") }, m) },
    // F4 punto
    f4: { w: 10, h: 10, refX: 5, refY: 5, dibujo: (m, p) => el("circle", { cx: 5, cy: 5, r: 3.2, ...p("fill") }, m) },
    // F5 cuadrado: un bloque lleno, alineado con la línea
    f5: { w: 10, h: 10, refX: 5, refY: 5, dibujo: (m, p) => el("rect", { x: 2, y: 2, width: 6, height: 6, ...p("fill") }, m) },
  };
  const TINTAS = ["ink", "gris", "suave", "ember", "papel"];
  // escala global de cada remate; por defecto 0.7 (elegida por Macarena, 2026-10-26). La cambia Trazos.tamanoRemates
  const ESCALA_BASE = 0.7;
  const escalaRemate = { f1: ESCALA_BASE, f2: ESCALA_BASE, f3: ESCALA_BASE, f4: ESCALA_BASE, f5: ESCALA_BASE };
  function aplicarTamanos() {
    document.querySelectorAll("marker[data-remate]").forEach((m) => {
      const R = REMATES[m.dataset.remate], k = +m.dataset.k * escalaRemate[m.dataset.remate];
      m.setAttribute("markerWidth", f(R.w * k)); m.setAttribute("markerHeight", f(R.h * k));
      if (R.barba) m.firstChild.setAttribute("stroke-width", f(TRAZO_REMATE / k));
    });
    document.querySelectorAll("svg.tec").forEach(ajustarPuntas);
  }

  /* Las puntas: una línea con flecha (F1, F2) no llega hasta la punta. Si llegara, su
     extremo redondeado asomaría por delante y a los costados del triángulo, más cuanto
     más gruesa es. Se corta (con stroke-dasharray, sin tocar su geometría) donde la
     flecha ya la tapa entera: en F1, donde el triángulo es más ancho que la línea;
     en F2, justo para que el redondeo termine en la punta. Las punteadas no se tocan. */
  const SEN_F1 = Math.sin(Math.atan(4.5 / 11)); // medio ángulo de la punta de F1
  function ajustarPuntas(svgN) {
    svgN.querySelectorAll(".f1, .f2").forEach((n) => {
      if (n.closest("mask, marker, defs") || !n.getTotalLength) return;
      const cls = n.getAttribute("class") || "";
      if (/\bl[345]\b/.test(cls)) return;
      const r = /\bf1\b/.test(cls) ? "f1" : "f2", tm = cls.match(/\bf-(chica|grande|extra)\b/), tam = tm ? tm[1] : "normal";
      const k = TAMANOS[tam] * escalaRemate[r], largo = (r === "f1" ? 11 : 10) * k;
      const sw = parseFloat(getComputedStyle(n).strokeWidth) || 1, L = n.getTotalLength();
      const x = Math.min(r === "f1" ? sw / (2 * SEN_F1) : sw / 2, largo * 0.85, L / 3);
      const x0 = /\bambos\b/.test(cls) ? x : 0;
      n.style.strokeDasharray = `${f(L - x - x0)} ${f(L * 2 + 10)}`;
      n.style.strokeDashoffset = f(-x0);
    });
  }
  /* Trazos.tamanoRemates(k)        escala todos los remates (base 0.7; 1 = el tamaño de dibujo)
     Trazos.tamanoRemates(k, "f1")  escala solo uno
     Trazos.tamanoRemates("base")   vuelve a la escala por defecto (0.7)
     Trazos.tamanoRemates()         devuelve las escalas actuales */
  function tamanoRemates(k, cual) {
    if (k == null) return { ...escalaRemate };
    if (k === "base") k = ESCALA_BASE;
    (cual ? [cual] : Object.keys(escalaRemate)).forEach((id) => { escalaRemate[id] = +k; });
    aplicarTamanos();
    return { ...escalaRemate };
  }

  /* ---------- el bolígrafo ----------
     Las líneas (L1–L7, y con ellas remates y cotas) pasan por un filtro que las hace
     parecer dibujadas con birome: temblor del pulso, presión que varía a lo largo
     del trazo y grano fino donde la tinta saltea. Todo en unidades del viewBox.
       temblor  cuánto se corre el trazo (0 = recto)          frecTemblor  qué tan seguido ondula
       borde    cuánto se desflecan los bordes de la tinta (0 = limpio)
       presion  cuánto se aclara la tinta en los tramos flojos (0 = pareja)
       grano    cuánto saltea la tinta (0 = sin grano)        frecGrano    tamaño del grano
     Trazos.boligrafo({ temblor: 2 })   cambia uno o varios valores
     Trazos.boligrafo("base")           vuelve a los de por defecto
     Trazos.boligrafo()                 devuelve los actuales
     Para dibujar algo vectorial: class="vectorial" en la línea o en el <svg>. */
  const BOLI_BASE = { temblor: 1.4, frecTemblor: 0.035, borde: 0.5, presion: 0.35, grano: 0.3, frecGrano: 1.8 };
  const boli = { ...BOLI_BASE };
  /* Cada gráfico tiene su propio filtro, ajustado a cuántos píxeles mide una unidad
     del dibujo en pantalla (data-s): así el bolígrafo se ve igual en un gráfico chico
     y en uno grande achicado. Los valores de BOLI_BASE están en píxeles de pantalla. */
  function crearFiltro(defsN, id, region, tipo = "grueso") {
    const fino = tipo !== "grueso";
    const fb = el("filter", { id, "data-s": 1, "data-tipo": tipo, filterUnits: "userSpaceOnUse", ...region, "color-interpolation-filters": "sRGB" }, defsN);
    el("feTurbulence", { "data-p": "temblor", type: "fractalNoise", numOctaves: 3, seed: 4, result: "temblor" }, fb);
    el("feDisplacementMap", { "data-p": "mov", in: "SourceGraphic", in2: "temblor", xChannelSelector: "R", yChannelSelector: "G", result: "movido" }, fb);
    el("feTurbulence", { "data-p": "fleco", type: "fractalNoise", numOctaves: 1, seed: 6, result: "fleco" }, fb);
    if (!fino) {
      // el borde (líneas gruesas): un temblor mucho más fino y chico que desfleca el canto de la tinta
      el("feDisplacementMap", { "data-p": "borde", in: "movido", in2: "fleco", xChannelSelector: "R", yChannelSelector: "G", result: "mov" }, fb);
    } else {
      // el borde (líneas finas): desplazar el canto de una línea de un píxel la corta. En cambio,
      // la tinta se corre: el trazo se difumina, el ruido mueve el umbral y se vuelve a recortar.
      // El ancho varía y el canto queda irregular sin que la línea se corte.
      el("feGaussianBlur", { "data-p": "corrida", in: "movido", result: "corrida" }, fb);
      el("feColorMatrix", { in: "fleco", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0", result: "flecoA" }, fb);
      el("feComposite", { "data-p": "umbral", in: "corrida", in2: "flecoA", operator: "arithmetic", k1: 0, k2: 1, result: "umbral" }, fb);
      const ct = el("feComponentTransfer", { in: "umbral", result: "mascara" }, fb);
      el("feFuncA", { "data-p": "corte", type: "linear", slope: 6, intercept: -1.3 }, ct);
      // el color: el mismo trazo difuminado, vuelto opaco (conserva el color de cada parte;
      // engordarlo con feMorphology tomaba el canal más claro y el papel tapaba la tinta)
      const op = el("feComponentTransfer", { in: "corrida", result: "gordo" }, fb);
      el("feFuncA", { type: "linear", slope: 40, intercept: 0 }, op);
      el("feComposite", { in: "gordo", in2: "mascara", operator: "in", result: "mov" }, fb);
    }
    el("feTurbulence", { "data-p": "presion", type: "fractalNoise", numOctaves: 2, seed: 9, result: "presion" }, fb);
    el("feColorMatrix", { "data-p": "presionA", in: "presion", type: "matrix", result: "presionA" }, fb);
    el("feTurbulence", { "data-p": "grano", type: "fractalNoise", numOctaves: 1, seed: 2, result: "grano" }, fb);
    el("feColorMatrix", { "data-p": "granoA", in: "grano", type: "matrix", result: "granoA" }, fb);
    el("feComposite", { in: "mov", in2: "presionA", operator: "in", result: "conPresion" }, fb);
    el("feComposite", { in: "conPresion", in2: "granoA", operator: "in" }, fb);
    aplicarBoli(fb);
    return fb;
  }
  function aplicarBoli(fb) {
    if (!fb) { document.querySelectorAll("filter[data-s]").forEach(aplicarBoli); return; }
    const sc = +fb.getAttribute("data-s") || 1, q = (k) => fb.querySelector(`[data-p="${k}"]`);
    // las líneas finas (L2–L7) usan una variante: el borde se arma corriendo la tinta
    // (ver crearFiltro) y llevan poco grano, para que un trazo de un píxel se vea a mano
    // sin cortarse
    const tipo = fb.getAttribute("data-tipo"), fino = tipo !== "grueso", capilar = tipo === "capilar";
    const kb = 1, kf = fino ? 0.5 : 1, kg = capilar ? 0.12 : fino ? 0.3 : 1, kt = fino ? 0.8 : 1;
    // frecuencias: por píxel → por unidad (× sc); desplazamientos: píxeles → unidades (÷ sc)
    q("temblor").setAttribute("baseFrequency", +(boli.frecTemblor * sc).toFixed(4));
    q("mov").setAttribute("scale", +(boli.temblor * kt / sc).toFixed(3));
    q("fleco").setAttribute("baseFrequency", +(0.9 * kf * sc).toFixed(4));
    if (!fino) q("borde").setAttribute("scale", +(boli.borde * kb / sc).toFixed(3));
    else {
      // corrida 0.6 px; el ruido mueve el umbral: alfa = difuso + g·(ruido − 0.5), g = borde·1.1
      // la capilar (L7, 0.6) es tan fina que con el mismo borde se corta: menos ruido y un corte más bajo
      const g = boli.borde * (capilar ? 0.45 : 1.1);
      q("corte").setAttribute("intercept", capilar ? -0.9 : -1.3);
      q("corrida").setAttribute("stdDeviation", +(0.6 / sc).toFixed(3));
      q("umbral").setAttribute("k3", +g.toFixed(3)); q("umbral").setAttribute("k4", +(-g * 0.5).toFixed(3));
    }
    q("presion").setAttribute("baseFrequency", +(0.012 * sc).toFixed(5));
    // presión: alfa = 1 - presion·(1 - ruido), ruido lento en R ≈ 0.25…0.75
    const pr = boli.presion * 2;
    q("presionA").setAttribute("values", `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${pr} 0 0 0 ${1 - pr * 0.5}`);
    const fg = boli.frecGrano * sc;
    q("grano").setAttribute("baseFrequency", `${+fg.toFixed(4)} ${+(fg * 0.8).toFixed(4)}`);
    // grano: alfa = k·R - (k·0.5 - 1); con k alto aparecen huecos en los valles del ruido
    const k = 1 + boli.grano * kg * 6;
    q("granoA").setAttribute("values", `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${1.15 - k * 0.42}`);
  }
  // un filtro propio por <svg class="tec">, recalculado cuando cambia de tamaño
  let nFiltro = 0;
  const vigilar = typeof ResizeObserver !== "undefined" ? new ResizeObserver((es) => es.forEach((e) => ajustarFiltro(e.target))) : null;
  function ajustarFiltro(svgN) {
    const vb = svgN.viewBox && svgN.viewBox.baseVal; if (!vb || !vb.width) return;
    const ancho = svgN.getBoundingClientRect().width; if (!ancho) return;
    let fb = svgN._boli;
    if (!fb) {
      const defsN = svgN.querySelector(":scope > defs") || svgN.insertBefore(el("defs", {}), svgN.firstChild);
      const m = Math.max(vb.width, vb.height) * 0.2;
      const reg = { x: vb.x - m, y: vb.y - m, width: vb.width + 2 * m, height: vb.height + 2 * m }, n = ++nFiltro;
      fb = svgN._boli = ["grueso", "fino", "capilar"].map((t) => crearFiltro(defsN, t === "grueso" ? `tz-boli-${n}` : `tz-boli-${t}-${n}`, reg, t));
      svgN.style.setProperty("--tz-boli", `url(#${fb[0].id})`);
      svgN.style.setProperty("--tz-boli-fino", `url(#${fb[1].id})`);
      svgN.style.setProperty("--tz-boli-capilar", `url(#${fb[2].id})`);
    }
    fb.forEach((x) => { x.setAttribute("data-s", +(ancho / vb.width).toFixed(4)); aplicarBoli(x); });
    ajustarPuntas(svgN);
  }
  function boligrafo(o) {
    if (o == null) return { ...boli };
    Object.assign(boli, o === "base" ? BOLI_BASE : o);
    aplicarBoli();
    return { ...boli };
  }

  /* R2 / R3: niveles de densidad del rayado (paso entre líneas y grosor). 1 = abierto, 5 = cerrado */
  const RAYADO = { 1: { paso: 12, w: 0.6 }, 2: { paso: 9, w: 0.6 }, 3: { paso: 7, w: 0.6 }, 4: { paso: 5, w: 0.6 }, 5: { paso: 3.5, w: 0.55 } };
  /* R5 moiré: distancia mínima entre puntos, radio, variación de radio, baldosa y semilla */
  const MOIRE = { dist: 5, r: 1.25, vari: 0.15, tile: 60, semilla: 11 };
  let MOIRE_PUNTOS = null;
  function puntosMoire() {
    if (MOIRE_PUNTOS) return MOIRE_PUNTOS;
    const { dist, r, vari, tile: T } = MOIRE, pts = [];
    let sd = MOIRE.semilla;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const lejos = (x, y) => pts.every(([px, py]) => {
      let dx = Math.abs(px - x), dy = Math.abs(py - y);
      dx = Math.min(dx, T - dx); dy = Math.min(dy, T - dy);
      return dx * dx + dy * dy >= dist * dist;
    });
    for (let fallos = 0; fallos < 3000;) {
      const x = rnd() * T, y = rnd() * T;
      if (lejos(x, y)) { pts.push([x, y]); fallos = 0; } else fallos++;
    }
    // cada punto se dibuja también del otro lado de los bordes que toca, para que la baldosa cierre
    const out = [];
    for (const [x, y] of pts) {
      const rr = +(r * (1 - vari + 2 * vari * rnd())).toFixed(2);
      for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) {
        const X = x + ox, Y = y + oy;
        if (X > -rr && X < T + rr && Y > -rr && Y < T + rr) out.push([f(X), f(Y), rr]);
      }
    }
    return (MOIRE_PUNTOS = out);
  }
  let defsHechos = false;
  function defs() {
    if (defsHechos) return; defsHechos = true;
    const holder = el("svg", { width: 0, height: 0, style: "position:absolute;width:0;height:0;overflow:hidden", "aria-hidden": "true" }, document.body);
    const d = el("defs", {}, holder);
    // Cada remate existe en cuatro tamaños: tz-f1 (normal), tz-f1-chica, tz-f1-grande, tz-f1-extra.
    // El tamaño escala la forma; el grosor de las barbas (F2, F3) se mantiene igual al de la línea.
    for (const [id, R] of Object.entries(REMATES)) {
      for (const [tam, k] of Object.entries(TAMANOS)) {
        const base = tam === "normal" ? `tz-${id}` : `tz-${id}-${tam}`;
        // uno por tinta, y el de reserva (sin tinta) que toma el color de la línea si el navegador puede
        for (const tinta of [null, ...TINTAS]) {
          const m = el("marker", { id: tinta ? `${base}-${tinta}` : base, viewBox: `0 0 ${R.w} ${R.h}`, refX: R.refX, refY: R.refY, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse", "data-remate": id, "data-k": k }, d);
          R.dibujo(m, (prop) => tinta ? { style: `${prop}: var(--tz-${tinta})` } : { [prop]: "context-stroke" });
        }
      }
    }
    aplicarTamanos();

    // el bolígrafo de reserva (para un <svg class="tec"> que no pasó por Trazos.svg): 1 unidad = 1 px.
    // Región en unidades del dibujo (no del objeto) para que las rectas, sin alto, no desaparezcan.
    // t-fondo: un fondo de papel detrás de una etiqueta, para que se lea sobre un rayado o una
    // línea. Sigue la forma de las letras (las engorda y las pinta de papel), así que aparece
    // con ellas cuando se escriben a máquina (M6)
    const fo = el("filter", { id: "tz-fondo", x: "-0.15", y: "-0.7", width: "1.3", height: "2.4" }, d);
    el("feMorphology", { in: "SourceAlpha", operator: "dilate", radius: "7 6", result: "gordo" }, fo);
    el("feFlood", { style: "flood-color: var(--tz-papel)", result: "papel" }, fo);
    el("feComposite", { in: "papel", in2: "gordo", operator: "in", result: "fondo" }, fo);
    const mg = el("feMerge", {}, fo); el("feMergeNode", { in: "fondo" }, mg); el("feMergeNode", { in: "SourceGraphic" }, mg);
    crearFiltro(d, "tz-boli", { x: -200, y: -200, width: 2800, height: 1800 });
    crearFiltro(d, "tz-boli-fino", { x: -200, y: -200, width: 2800, height: 1800 }, "fino");
    crearFiltro(d, "tz-boli-capilar", { x: -200, y: -200, width: 2800, height: 1800 }, "capilar");

    for (const c of COLORES) {
      const col = COLOR(c);
      // R2 rayado y R3 rayado cruzado, a 45°, en cinco niveles de densidad (RAYADO).
      // tz-r2-n1-ink … tz-r2-n5-ink; el nivel 3 es también el de por defecto (tz-r2-ink).
      // La línea va en el centro de la baldosa para que no la recorte el borde.
      for (const [nivel, { paso, w }] of Object.entries(RAYADO)) {
        for (const tipo of ["r2", "r3"]) {
          const ids = [`tz-${tipo}-n${nivel}-${c}`]; if (nivel === "3") ids.push(`tz-${tipo}-${c}`);
          for (const id of ids) {
            const q = el("pattern", { id, patternUnits: "userSpaceOnUse", width: paso, height: paso, patternTransform: "rotate(45)" }, d);
            el("line", { x1: paso / 2, y1: 0, x2: paso / 2, y2: paso, stroke: col, "stroke-width": w }, q);
            if (tipo === "r3") el("line", { x1: 0, y1: paso / 2, x2: paso, y2: paso / 2, stroke: col, "stroke-width": w }, q);
          }
        }
      }
      let p;
      // R4 trama de puntos regular, paso 6
      p = el("pattern", { id: `tz-r4-${c}`, patternUnits: "userSpaceOnUse", width: 6, height: 6 }, d);
      el("circle", { cx: 3, cy: 3, r: 0.9, fill: col }, p);
      // R5 moiré: puntos sueltos casi parejos, sin grilla y sin amontonarse
      // (muestreo de disco de Poisson sobre una baldosa que se cierra sobre sí misma,
      // así repite sin cortes). Los puntos salen de una semilla fija: siempre los mismos.
      p = el("pattern", { id: `tz-r5-${c}`, patternUnits: "userSpaceOnUse", width: MOIRE.tile, height: MOIRE.tile }, d);
      for (const [x, y, r] of puntosMoire()) el("circle", { cx: x, cy: y, r, fill: col }, p);
    }
  }

  /* ---------- geometría ---------- */
  const unit = (ax, ay, bx, by) => { const L = Math.hypot(bx - ax, by - ay) || 1; return { ux: (bx - ax) / L, uy: (by - ay) / L, L }; };
  // normal "hacia el lado": positivo = a la izquierda del sentido a→b (arriba en una cota horizontal)
  const normal = (u) => ({ nx: u.uy, ny: -u.ux });

  /* tamaño de un punto: un nombre ("chica" | "normal" | "grande" | "extra") o un
     radio libre en número. Devuelve {cls, style} para sumar al elemento. */
  const tamPunto = (tam) => typeof tam === "number" ? { cls: "", style: `--pr: ${tam}` }
    : { cls: tam && tam !== "normal" ? `p-${tam}` : "", style: null };

  /* P4 cruz · Trazos.cruz(parent, x, y, tam="normal", cls, mas=false)  × (o + con mas) */
  function cruz(parent, x, y, tam = "normal", cls = "", mas = false) {
    // el bolígrafo va en el <g> (class p4-trazo), no en el path: el path tiene una escala CSS
    // y el filtro, aplicado ahí, se agrandaría con ella
    const t = tamPunto(tam), g = el("g", { class: "p4-trazo", transform: `translate(${f(x)} ${f(y)})` }, parent);
    const d = mas ? "M-1,0 H1 M0,-1 V1" : "M-1,-1 L1,1 M1,-1 L-1,1";
    return el("path", { d, class: `p4 ${t.cls} ${cls}`.trim(), style: t.style }, g);
  }

  /* P5 diana · Trazos.diana(parent, x, y, tam="normal", cls)  anillo, centro lleno y aire */
  function diana(parent, x, y, tam = "normal", cls = "") {
    const t = tamPunto(tam), g = el("g", { class: `p5 ${t.cls} ${cls}`.trim(), style: t.style }, parent);
    for (const c of ["p5-aire", "p5-anillo", "p5-centro"]) el("circle", { cx: f(x), cy: f(y), class: c }, g);
    return g;
  }

  /* P1–P3 · Trazos.punto(parent, x, y, tipo="p1", tam="normal", cls) */
  function punto(parent, x, y, tipo = "p1", tam = "normal", cls = "") {
    const t = tamPunto(tam);
    return el("circle", { cx: f(x), cy: f(y), class: `${tipo} ${t.cls} ${cls}`.trim(), style: t.style }, parent);
  }

  /* Trazos.tamanoPuntos(k)       escala todos los puntos (1 = la regla)
     Trazos.tamanoPuntos("base")  vuelve a 1
     Trazos.tamanoPuntos()        devuelve la escala actual */
  function tamanoPuntos(k) {
    const root = document.documentElement;
    if (k == null) return +(getComputedStyle(root).getPropertyValue("--tz-p-escala") || 1);
    if (k === "base") k = 1;
    root.style.setProperty("--tz-p-escala", +k);
    return +k;
  }

  /* C1 cota · {x1,y1,x2,y2, texto, lado=28, ext=true, remate='f3'|'f1'|'f2', tamano='normal'|'chica'|'grande'|'extra', color, hueco=true}
     Dos líneas de extensión (L7) desde los puntos, la línea de cota (L2) a
     `lado` de distancia con remates en ambos extremos, y el texto en el medio
     sobre un hueco de la línea (hueco=false: texto encima, línea entera). */
  function cota(parent, o) {
    const { x1, y1, x2, y2 } = o, lado = o.lado ?? 28, remate = o.remate || "f3", color = o.color || "";
    const suf = o.tamano && o.tamano !== "normal" ? `-${o.tamano}` : "";
    const mk = `marker-start: var(--tz-${remate}${suf}, url(#tz-${remate}${suf}))`; // la tinta de la línea
    const u = unit(x1, y1, x2, y2), { nx, ny } = normal(u);
    const g = el("g", { class: `c1 ${color}` }, parent);
    const ax = x1 + nx * lado, ay = y1 + ny * lado, bx = x2 + nx * lado, by = y2 + ny * lado;
    if (o.ext !== false) {
      const gap = 3, mas = 6 * Math.sign(lado || 1);
      el("line", { x1: f(x1 + nx * gap), y1: f(y1 + ny * gap), x2: f(ax + nx * mas), y2: f(ay + ny * mas), class: "l7" }, g);
      el("line", { x1: f(x2 + nx * gap), y1: f(y2 + ny * gap), x2: f(bx + nx * mas), y2: f(by + ny * mas), class: "l7" }, g);
    }
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const ang = Math.atan2(u.uy, u.ux) * 180 / Math.PI;
    const giro = ang > 90 || ang < -90 ? ang + 180 : ang; // el texto nunca cabeza abajo
    if (o.texto && o.hueco !== false) {
      const h = (o.ancho ?? (o.texto.length * 7.2 + 14)) / 2;
      // cada mitad va del extremo al hueco: el remate solo en el extremo (marker-start)
      el("line", { x1: f(ax), y1: f(ay), x2: f(mx - u.ux * h), y2: f(my - u.uy * h), class: "l2", style: mk }, g);
      el("line", { x1: f(bx), y1: f(by), x2: f(mx + u.ux * h), y2: f(my + u.uy * h), class: "l2", style: mk }, g);
      texto(g, f(mx), f(my), o.texto, `${o.cls || "t1"} t-centro`, { dy: "0.36em", transform: `rotate(${f(giro)} ${f(mx)} ${f(my)})` });
    } else {
      el("line", { x1: f(ax), y1: f(ay), x2: f(bx), y2: f(by), class: `l2 ${remate} ambos${o.tamano && o.tamano !== "normal" ? " f-" + o.tamano : ""}` }, g);
      if (o.texto) texto(g, f(mx + nx * 9), f(my + ny * 9), o.texto, `${o.cls || "t1"} t-centro`, { dy: lado >= 0 ? "0" : "0.75em", transform: `rotate(${f(giro)} ${f(mx + nx * 9)} ${f(my + ny * 9)})` });
    }
    return g;
  }

  /* C2 llave · {x1,y1,x2,y2, lado=18, texto, color}  Una llave { que abarca de 1 a 2,
     con la punta hacia `lado` (negativo: del otro lado). */
  function llave(parent, o) {
    const { x1, y1, x2, y2 } = o, lado = o.lado ?? 18, color = o.color || "";
    const u = unit(x1, y1, x2, y2), { nx, ny } = normal(u), s = Math.sign(lado) || 1, h = Math.abs(lado), r = Math.min(h / 2, 8), L = u.L;
    // coordenadas locales: t a lo largo del tramo, v hacia el lado de la punta
    const P = (t, v) => `${f(x1 + u.ux * t + nx * s * v)},${f(y1 + u.uy * t + ny * s * v)}`;
    const d = `M${P(0, 0)} Q${P(0, r)} ${P(r, r)} L${P(L / 2 - r, r)} Q${P(L / 2, r)} ${P(L / 2, h)}`
      + ` Q${P(L / 2, r)} ${P(L / 2 + r, r)} L${P(L - r, r)} Q${P(L, r)} ${P(L, 0)}`;
    const g = el("g", { class: `c2 ${color}` }, parent);
    el("path", { d, class: "l2" }, g);
    if (o.texto) {
      const ang = Math.atan2(u.uy, u.ux) * 180 / Math.PI, giro = ang > 90 || ang < -90 ? ang + 180 : ang;
      const lx = x1 + u.ux * L / 2 + nx * s * (h + 10), ly = y1 + u.uy * L / 2 + ny * s * (h + 10);
      texto(g, f(lx), f(ly), o.texto, `${o.cls || "t1"} t-centro`, { dy: ny * s < 0 ? "0" : "0.8em", transform: `rotate(${f(giro)} ${f(lx)} ${f(ly)})` });
    }
    return g;
  }

  /* C3 nota · {x,y, dx,dy, texto, codo=true, marca='p2'|'p1'|'f1'|null, color, cls}
     Una línea de referencia desde el punto (x,y) hasta (x+dx, y+dy); si codo,
     sigue en horizontal un tramo corto y el texto va al final. */
  function nota(parent, o) {
    const { x, y, dx, dy } = o, color = o.color || "", marca = o.marca === undefined ? "p2" : o.marca, codo = o.codo !== false;
    const g = el("g", { class: `c3 ${color}` }, parent);
    const ex = x + dx, ey = y + dy, der = dx >= 0, cx = codo ? ex + (der ? 14 : -14) : ex;
    const d = `M${f(x)},${f(y)} L${f(ex)},${f(ey)}` + (codo ? ` L${f(cx)},${f(ey)}` : "");
    const p = el("path", { d, class: "l7" }, g);
    if (marca === "f1" || marca === "f2") { p.setAttribute("class", `l7 ${marca}`); p.setAttribute("d", `M${f(cx)},${f(ey)} ${codo ? `L${f(ex)},${f(ey)}` : ""} L${f(x)},${f(y)}`); }
    else if (marca) punto(g, x, y, marca, "chica");
    if (o.texto) {
      const lineas = Array.isArray(o.texto) ? o.texto : [o.texto];
      const t = texto(g, f(cx + (der ? 6 : -6)), f(ey), lineas[0], `${o.cls || "t1"}${der ? "" : " t-fin"}`, { dy: "0.36em" });
      lineas.slice(1).forEach((l) => { const ts = el("tspan", { x: f(cx + (der ? 6 : -6)), dy: "1.35em" }, t); ts.textContent = l; });
    }
    return g;
  }

  /* C4 escala · {x1,y1,x2,y2, n=10, cada=5, largo=6, lado=1, etiquetas?, color}
     Ticks perpendiculares a lo largo del segmento; cada `cada` ticks uno mayor
     (doble largo). `etiquetas` es un array (uno por tick mayor) o una función (i → texto). */
  function escala(parent, o) {
    const { x1, y1, x2, y2 } = o, n = o.n ?? 10, cada = o.cada ?? 5, largo = o.largo ?? 6, lado = o.lado ?? 1, color = o.color || "";
    const u = unit(x1, y1, x2, y2), { nx, ny } = normal(u);
    const g = el("g", { class: `c4 ${color}` }, parent);
    if (o.linea !== false) el("line", { x1, y1, x2, y2, class: "l2" }, g);
    for (let i = 0; i <= n; i++) {
      const px = x1 + u.ux * u.L * i / n, py = y1 + u.uy * u.L * i / n, mayor = cada && i % cada === 0, L = mayor ? largo * 2 : largo;
      el("line", { x1: f(px), y1: f(py), x2: f(px + nx * lado * L), y2: f(py + ny * lado * L), class: mayor ? "l2" : "l7" }, g);
      if (mayor && o.etiquetas) {
        const str = typeof o.etiquetas === "function" ? o.etiquetas(i) : o.etiquetas[i / cada];
        if (str != null) texto(g, f(px + nx * lado * (L + 8)), f(py + ny * lado * (L + 8)), str, `${o.cls || "t2"} t-centro`, { dy: "0.36em" });
      }
    }
    return g;
  }

  /* C5 eje · {x1,y1,x2,y2, texto, remate='f1', color, cls, pos='fin'|'medio'}
     Un eje: L2 con flecha cerrada al final y la etiqueta T1 al final (debajo /
     a la izquierda) o en el medio. */
  function eje(parent, o) {
    const { x1, y1, x2, y2 } = o, remate = o.remate || "f1", color = o.color || "";
    const g = el("g", { class: `c5 ${color}` }, parent);
    el("line", { x1, y1, x2, y2, class: `l2 ${remate}` }, g);
    if (o.texto) {
      const u = unit(x1, y1, x2, y2), vertical = Math.abs(u.uy) > Math.abs(u.ux);
      if (vertical) {
        const tx = x1 - 14, ty = o.pos === "medio" ? (y1 + y2) / 2 : y2 + 10;
        texto(g, f(tx), f(ty), o.texto, `${o.cls || "t1"} t-centro`, { transform: `rotate(-90 ${f(tx)} ${f(ty)})`, dy: o.pos === "medio" ? "0.36em" : "0" });
        if (o.pos !== "medio") g.lastChild.setAttribute("text-anchor", "start");
      } else {
        const tx = o.pos === "medio" ? (x1 + x2) / 2 : x2, ty = y2 + 24;
        texto(g, f(tx), f(ty), o.texto, `${o.cls || "t1"} ${o.pos === "medio" ? "t-centro" : "t-fin"}`);
      }
    }
    return g;
  }

  /* ---------- motion: el trazo se dibuja ----------
     dibujar(el, {dur=1200, delay=0, ease}) deja el elemento listo y lo dibuja de
     0 a 1 en `dur` ms. Devuelve {reset(), play(), set(u)} para controlarlo desde un loop. */
  const easeOut = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  function dibujar(n, o = {}) {
    const L = n.getTotalLength ? n.getTotalLength() : 0;
    if (!L) return { reset() {}, play() {}, set() {} };
    const dash = n.getAttribute("stroke-dasharray"); // una L3/L4 punteada se dibuja con un clip, no con dasharray
    const esPunteada = !!dash || /\bl[345]\b/.test(n.getAttribute("class") || "");
    let clipRect = null;
    if (esPunteada) {
      const svgRoot = n.ownerSVGElement, defsN = svgRoot.querySelector("defs") || el("defs", {}, svgRoot);
      const id = "tz-clip-" + Math.random().toString(36).slice(2, 8);
      const cp = el("clipPath", { id }, defsN);
      const b = n.getBBox();
      clipRect = el("rect", { x: b.x - 4, y: b.y - 4, width: 0, height: b.height + 8 }, cp);
      clipRect._w = b.width + 8;
      n.setAttribute("clip-path", `url(#${id})`);
    }
    const set = (u) => {
      u = Math.max(0, Math.min(1, u));
      if (clipRect) clipRect.setAttribute("width", f(clipRect._w * u));
      else { n.style.strokeDasharray = `${L}`; n.style.strokeDashoffset = `${L * (1 - u)}`; }
      n.style.opacity = u > 0 ? 1 : 0;
    };
    const reset = () => set(0);
    let raf = null;
    const play = () => new Promise((res) => {
      if (raf) cancelAnimationFrame(raf);
      const dur = o.dur ?? 1200, delay = o.delay ?? 0, ease = o.ease || easeOut;
      const t0 = performance.now() + delay;
      const tick = (now) => { const u = (now - t0) / dur; set(ease(u)); if (u < 1) raf = requestAnimationFrame(tick); else { raf = null; res(); } };
      raf = requestAnimationFrame(tick);
    });
    reset();
    return { reset, play, set, L };
  }

  window.Trazos = { el, svg, texto, defs, ajustarPuntas, boligrafo, BOLI_BASE, tamanoRemates, TAMANOS, ESCALA_BASE, punto, cruz, diana, tamanoPuntos, cota, llave, nota, escala, eje, dibujar, COLORES };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", defs); else defs();
})();
