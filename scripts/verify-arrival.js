// Verifies who the arrival ticket is made out to, without a browser and
// without a test runner (this repo has no package.json on purpose).
//
//   node scripts/verify-arrival.js
//
// It loads arrival.js into a vm context with just enough of a page around it,
// and lifts unlockFromUrl out of app.js to drive it with a stubbed fetch:
//   a-b. no link in flight -- the ticket names the saved hire, or "You"
//   c-d. a ?code= link in flight -- the ticket names nobody until the answer
//        lands, and then names the hire the link is for. A link for one hire
//        must never show the last hire's name: that is the forbidden case.
//   e.   the lookup fails -- the ticket falls back to what it shows today
//   f.   app.js raises the pending flag before it asks, and settles it on a
//        good answer, a refused answer and a network error alike
// Exits non-zero when any check fails.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ARRIVAL = fs.readFileSync(path.join(ROOT, 'arrival.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

// A verifier that STOPS EARLY must never look like a verifier that passed.
let finished = false;
process.on('exit', (code) => {
  if (!finished && code === 0) {
    console.error('\nFAILED: the verifier exited before finishing -- something awaited never settled');
    process.exitCode = 1;
  }
});

let failures = 0;
let total = 0;
function check(label, cond, detail) {
  total++;
  if (cond) console.log('  ok   ' + label);
  else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}

function classList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach((x) => set.add(x)),
    remove: (...c) => c.forEach((x) => set.delete(x)),
    contains: (c) => set.has(c)
  };
}

function el(id) {
  return {
    id, hidden: false, textContent: '', classList: classList(),
    addEventListener() {}, removeEventListener() {}, focus() {}
  };
}

function kit(name) {
  return JSON.stringify({ code: 'c-' + name, data: { name, firstName: name } });
}

// One fresh page: a store, a window that really dispatches, and the ticket.
function load(opts) {
  const store = new Map();
  if (opts.saved) store.set('carrara_welcome', kit(opts.saved));
  const els = { arrival: el('arrival'), 'tk-name': el('tk-name'), 'tk-date': el('tk-date'), 'tk-go': el('tk-go') };
  const listeners = {};
  const win = {
    CarraraKitPending: !!opts.pending,
    matchMedia: () => ({ matches: true }),
    scrollTo() {},
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); },
    dispatchEvent(e) { (listeners[e.type] || []).slice().forEach((fn) => fn(e)); return true; }
  };
  const ctx = {
    window: win,
    document: {
      getElementById: (id) => els[id] || null,
      querySelector: () => null,
      body: { classList: classList() },
      addEventListener() {}
    },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    },
    location: { search: '', hash: '', pathname: '/' },
    URLSearchParams,
    matchMedia: win.matchMedia,
    scrollTo() {},
    requestAnimationFrame: () => 0,
    setTimeout: () => 0,
    clearTimeout() {},
    Event: class { constructor(type) { this.type = type; } },
    JSON
  };
  vm.createContext(ctx);
  vm.runInContext(ARRIVAL, ctx, { filename: 'arrival.js' });
  return {
    name: () => els['tk-name'].textContent,
    save: (n) => store.set('carrara_welcome', kit(n)),
    settle: (pending, type) => { win.CarraraKitPending = pending; win.dispatchEvent(new ctx.Event(type)); }
  };
}

const blank = (s) => String(s).trim() === '';

// Lift unlockFromUrl out of app.js by its braces and run it with stubs around
// it. The outcome of the request is chosen per run.
function liftUnlock() {
  const start = APP.indexOf('function unlockFromUrl()');
  if (start < 0) return null;
  let i = APP.indexOf('{', start), depth = 0;
  for (; i < APP.length; i++) {
    if (APP[i] === '{') depth++;
    else if (APP[i] === '}' && --depth === 0) break;
  }
  return APP.slice(start, i + 1);
}

async function driveUnlock(src, outcome) {
  const log = [];
  const win = {
    dispatchEvent(e) { log.push('event:' + e.type + ':pending=' + win.CarraraKitPending); return true; }
  };
  let pendingAtFetch;
  const ctx = {
    window: win,
    location: { search: '?code=abc', pathname: '/', hash: '' },
    URLSearchParams,
    history: { replaceState() {} },
    Event: class { constructor(type) { this.type = type; } },
    JSON,
    store: (k, v) => log.push('store:' + v.data.name),
    applyKitToHub: () => log.push('apply'),
    mountMyOnboarding: () => log.push('mount'),
    fetch: () => {
      pendingAtFetch = win.CarraraKitPending;
      if (outcome === 'ok') return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Romina' }) });
      if (outcome === 'refused') return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      return Promise.reject(new Error('offline'));
    }
  };
  vm.createContext(ctx);
  vm.runInContext('var kitData = null;\n' + src + '\nvar returned = unlockFromUrl();', ctx);
  for (let n = 0; n < 10; n++) await new Promise((r) => setImmediate(r));
  return { log, pendingAtFetch, pendingAfter: win.CarraraKitPending, returned: ctx.returned };
}

async function main() {
  console.log('\n[a] nothing saved, no link in flight');
  check('the ticket is made out to "You"', load({}).name() === 'You', load({}).name());

  console.log('\n[b] Karishma saved, no link in flight');
  check('the ticket is made out to Karishma', load({ saved: 'Karishma' }).name() === 'Karishma');

  console.log('\n[c] Karishma saved, a link for Romina in flight (the forbidden case)');
  {
    const p = load({ saved: 'Karishma', pending: true });
    check('while the link is looked up the ticket does not name Karishma', p.name() !== 'Karishma', p.name());
    check('nor "You"', p.name() !== 'You', p.name());
    check('the name line keeps its height (it is exactly one non-breaking space)', p.name() === '\u00a0', p.name());
    p.save('Romina');
    p.settle(false, 'carrara:kit-updated');
    check('once Romina\'s kit lands the ticket names Romina', p.name() === 'Romina', p.name());
  }

  console.log('\n[d] nothing saved, a link for Romina in flight (a first visit)');
  {
    const p = load({ pending: true });
    check('while the link is looked up the ticket does not say "You"', p.name() !== 'You', p.name());
    check('and names nobody (exactly one non-breaking space)', p.name() === '\u00a0', p.name());
    p.save('Romina');
    p.settle(false, 'carrara:kit-updated');
    check('once Romina\'s kit lands the ticket names Romina', p.name() === 'Romina', p.name());
  }

  console.log('\n[e] the lookup fails');
  {
    const p = load({ saved: 'Karishma', pending: true });
    check('while the failing link is looked up the ticket names nobody', blank(p.name()), p.name());
    p.settle(false, 'carrara:kit-settled');
    check('with Karishma saved, the ticket falls back to Karishma', p.name() === 'Karishma', p.name());
    const q = load({ pending: true });
    q.settle(false, 'carrara:kit-settled');
    check('with nothing saved, the ticket falls back to "You"', q.name() === 'You', q.name());
  }

  console.log('\n[f] app.js unlockFromUrl raises and settles the pending flag');
  {
    const src = liftUnlock();
    check('unlockFromUrl is found in app.js', !!src);
    if (src) {
      const ok = await driveUnlock(src, 'ok');
      check('the flag is up before the request is made', ok.pendingAtFetch === true, ok.pendingAtFetch);
      check('it still returns true for a link', ok.returned === true, ok.returned);
      check('a good answer keeps today\'s order, then settles',
        JSON.stringify(ok.log) === JSON.stringify([
          'store:Romina', 'apply', 'mount',
          'event:carrara:kit-updated:pending=true',
          'event:carrara:kit-settled:pending=false'
        ]), ok.log);
      check('a good answer leaves the flag down', ok.pendingAfter === false, ok.pendingAfter);

      const refused = await driveUnlock(src, 'refused');
      check('a refused answer stores nothing and settles',
        JSON.stringify(refused.log) === JSON.stringify(['event:carrara:kit-settled:pending=false']), refused.log);
      check('a refused answer leaves the flag down', refused.pendingAfter === false, refused.pendingAfter);

      const offline = await driveUnlock(src, 'offline');
      check('a network error stores nothing and settles',
        JSON.stringify(offline.log) === JSON.stringify(['event:carrara:kit-settled:pending=false']), offline.log);
      check('a network error leaves the flag down', offline.pendingAfter === false, offline.pendingAfter);
    }
  }

  finished = true;
  console.log('\n' + (total - failures) + ' of ' + total + ' checks passed');
  if (failures) {
    console.log(failures + ' FAILED');
    process.exitCode = 1;
  }
}

main().catch((e) => { finished = true; console.error(e); process.exitCode = 1; });
