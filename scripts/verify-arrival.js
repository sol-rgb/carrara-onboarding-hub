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
//   g-i. the ticket's first day: where it comes from, when a refresh keeps it,
//        and the Start row arrival.js shows and hides for it
//   j.   the boot: the saved kit dresses the page until a fresh one lands,
//        never while a link for another hire is in flight, and again when
//        that link fails
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
// The date line sits in a .tk-field with a .tk-rule just before it, the way
// index.html lays it out, because fillDate hides the two together.
function load(opts) {
  const store = new Map();
  if (opts.saved) store.set('carrara_welcome', kit(opts.saved));
  const els = { arrival: el('arrival'), 'tk-name': el('tk-name'), 'tk-date': el('tk-date'), 'tk-go': el('tk-go') };
  const dateRule = el('tk-date-rule');
  dateRule.classList.add('tk-rule');
  const dateField = el('tk-date-field');
  dateField.classList.add('tk-field');
  dateField.previousElementSibling = dateRule;
  els['tk-date'].parentNode = dateField;
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
    settle: (pending, type) => { win.CarraraKitPending = pending; win.dispatchEvent(new ctx.Event(type)); },
    date: () => els['tk-date'].textContent,
    dateShown: () => !dateField.hidden && !dateRule.hidden,
    dateHidden: () => dateField.hidden && dateRule.hidden,
    setStart: (v) => {
      if (v === undefined) delete win.CarraraStartDate; else win.CarraraStartDate = v;
      win.dispatchEvent(new ctx.Event('carrara:start-date'));
    }
  };
}

// Lift any named function out of app.js by its braces.
function liftFn(name) {
  const start = APP.indexOf('function ' + name + '(');
  if (start < 0) return null;
  let i = APP.indexOf('{', start), depth = 0;
  for (; i < APP.length; i++) {
    if (APP[i] === '{') depth++;
    else if (APP[i] === '}' && --depth === 0) break;
  }
  return APP.slice(start, i + 1);
}

// publishStartDate with what it reads around it: the kit, the team list, and
// a window that records every announcement. isDay may not exist on old code,
// in which case the lift is simply left out and the checks say so.
function startDatePage() {
  const events = [];
  const win = { dispatchEvent(e) { events.push(e.type); return true; } };
  const ctx = { window: win, Event: class { constructor(type) { this.type = type; } } };
  vm.createContext(ctx);
  const src = ['isDay', 'sameFirstAndInitial', 'publishStartDate'].map(liftFn).filter(Boolean).join('\n');
  vm.runInContext('var kitData = null; var teamData = [];\n' + src, ctx);
  return {
    run(kitValue, team) {
      ctx.kitData = kitValue;
      if (team) ctx.teamData = team;
      events.length = 0;
      ctx.publishStartDate();
      return { date: win.CarraraStartDate, events: events.slice() };
    }
  };
}

// refreshKit with a saved kit and a fresh answer, returning what it stored and
// what it now uses. The plan rule it shares a home with is the real one.
async function driveRefresh(savedData, fresh) {
  const MO = require(path.join(ROOT, 'my-onboarding.js'));
  const box = { carrara_welcome: { code: 'c', data: savedData } };
  const ctx = {
    window: { dispatchEvent() { return true; } },
    Event: class { constructor(type) { this.type = type; } },
    JSON, Object, Array, MO,
    store: (k, v) => { if (v === undefined) return box[k]; box[k] = v; },
    applyKitToHub() {}, mountMyOnboarding() {},
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(fresh))) })
  };
  vm.createContext(ctx);
  const src = ['isDay', 'refreshKit'].map(liftFn).filter(Boolean).join('\n');
  vm.runInContext('var kitData = null; var kitRefreshing = false;\n' + src + '\nrefreshKit();', ctx);
  for (let n = 0; n < 10; n++) await new Promise((r) => setImmediate(r));
  return { stored: box.carrara_welcome.data.startDate, used: ctx.kitData && ctx.kitData.startDate };
}

// The boot of app.js with the kit's whole path around it: the real
// unlockFromUrl, refreshKit, publishStartDate and seedKitFromSaved, the real
// listeners app.js hangs on the kit's two events for them, and the real last
// lines of the file, in the order they are written. Every /api/welcome answer
// is held until the check gives it, so a check can look at the page while a
// lookup is still in flight. A function the code does not have yet is simply
// left out, and the checks say what is missing.
function bootPage(opts) {
  const MO = require(path.join(ROOT, 'my-onboarding.js'));
  const box = {};
  if (opts.saved !== undefined) box.carrara_welcome = JSON.parse(JSON.stringify(opts.saved));
  const events = [];
  const listeners = {};
  const win = {
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent(e) {
      events.push(e.type);
      (listeners[e.type] || []).slice().forEach((fn) => fn(e));
      return true;
    }
  };
  const calls = { apply: [], mount: [] };
  const asks = [];
  const chkAsks = [];
  const ctx = {
    window: win,
    location: { search: opts.link ? '?code=' + opts.link : '', pathname: '/', hash: '' },
    URLSearchParams,
    history: { replaceState() {} },
    Event: class { constructor(type) { this.type = type; } },
    JSON, Object, Array, MO,
    store: (k, v) => { if (v === undefined) return box[k] === undefined ? null : box[k]; box[k] = v; },
    // The checklist's real syncChecklist runs too, so a check can count what
    // it asks /api/checklist. Its answer is chosen per page: by default none
    // ever comes, which is how the checks above see the page.
    CS: require(path.join(ROOT, 'checklist-sync.js')),
    flat: [], chkMode: 'local', chkState: {}, chkSaver: null,
    checklistToLocal() { ctx.chkMode = 'local'; ctx.chkCode = null; },
    setChecklistMode(m, st) { ctx.chkMode = m; ctx.chkState = st; },
    makeChecklistSaver() { return { now() {}, stop() {}, queue() {} }; },
    checklistApi(body) {
      chkAsks.push(body.code);
      return opts.checklist ? Promise.resolve(opts.checklist(body)) : new Promise(() => {});
    },
    fetch: (url, init) => new Promise((resolve, reject) => {
      asks.push({ code: JSON.parse(init.body).code, resolve, reject });
    })
  };
  vm.createContext(ctx);
  ctx.applyKitToHub = () => calls.apply.push(ctx.kitData && ctx.kitData.name);
  ctx.mountMyOnboarding = () => calls.mount.push(ctx.kitData && ctx.kitData.name);
  const names = ['isDay', 'sameFirstAndInitial', 'publishStartDate', 'unlockFromUrl', 'refreshKit', 'seedKitFromSaved',
    'currentChecklistCode', 'syncChecklist'];
  const src = names.map(liftFn).filter(Boolean).join('\n');
  const hooks = APP.split('\n').filter((line) =>
    /^\s*window\.addEventListener\('carrara:kit-(updated|settled)', (publishStartDate|seedKitFromSaved|syncChecklist)\);\s*$/.test(line)
  ).join('\n');
  const bootAt = APP.indexOf('if (!unlockFromUrl()) refreshKit();');
  const boot = bootAt < 0 ? '' : APP.slice(bootAt, APP.lastIndexOf('})();'));
  vm.runInContext('var kitData = null; var kitRefreshing = false; var teamData = [];\n'
    + 'var chkCode = null, chkReading = false, chkReadAgain = false;\n'
    + src + '\n' + hooks + '\n' + boot, ctx);
  const flush = async () => { for (let n = 0; n < 10; n++) await new Promise((r) => setImmediate(r)); };
  return {
    has: (name) => typeof ctx[name] === 'function',
    bootFound: bootAt >= 0,
    kit: () => ctx.kitData,
    date: () => win.CarraraStartDate,
    pending: () => win.CarraraKitPending,
    events, calls, asks, chkAsks, flush,
    chkMode: () => ctx.chkMode,
    async answer(i, outcome) {
      const a = asks[i];
      if (outcome === 'reject') a.reject(new Error('offline'));
      else if (outcome === 'notok') a.resolve({ ok: false, json: () => Promise.resolve({ error: 'nope' }) });
      else a.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(outcome))) });
      await flush();
    }
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

  console.log('\n[g] app.js publishStartDate: the kit\'s own date first, the team list after');
  {
    const p = startDatePage();
    const romina = { name: 'Romina', startDate: '2026-11-18' };
    let r = p.run(romina);
    check('the kit\'s date is published with no team list loaded', r.date === '2026-11-18', r);
    check('and announced once', JSON.stringify(r.events) === JSON.stringify(['carrara:start-date']), r.events);
    r = p.run(romina);
    check('publishing the same date again announces nothing', r.date === '2026-11-18' && r.events.length === 0, r);

    const q = startDatePage();
    r = q.run({ name: 'Ada Lovelace' }, [{ name: 'Ada Lovelace', startDate: '2026-12-01' }]);
    check('a kit with no date falls back to the team list and finds a full-name match', r.date === '2026-12-01', r);

    const real = [{ name: 'Romina Ideses', startDate: '2026-11-20' }, { name: 'Gonz Sanchez', startDate: '2024-01-01' }];
    const s = startDatePage();
    r = s.run({ name: 'Romina', startDate: '2026-11-18' }, real);
    check('"Romina" with a list row "Romina Ideses" and a kit date publishes the kit date', r.date === '2026-11-18', r);
    const t = startDatePage();
    r = t.run({ name: 'Romina' }, real);
    check('"Romina" with no kit date publishes nothing, as today', r.date === undefined && r.events.length === 0, r);

    const u = startDatePage();
    u.run({ name: 'Romina', startDate: '2026-11-18' });
    r = u.run({ name: 'Karishma' });
    check('a date set for one kit is cleared when the next kit has none', !r.date, r);
    check('with exactly one announcement', JSON.stringify(r.events) === JSON.stringify(['carrara:start-date']), r.events);
    r = u.run({ name: 'Karishma' });
    check('nothing changed, nothing announced', !r.date && r.events.length === 0, r);
    const v = startDatePage();
    r = v.run(null);
    check('no kit and no date announces nothing', r.date === undefined && r.events.length === 0, r);
    r = v.run({ name: 'Romina', startDate: '2026-11-18T00:00:00Z' });
    check('a timestamp on the kit is not a date', r.date === undefined && r.events.length === 0, r);
  }

  console.log('\n[h] app.js refreshKit keeps a saved first day only when POps did not answer');
  {
    const base = { name: 'Romina', plan: null, syncWith: [] };
    const saved = Object.assign({}, base, { startDate: '2026-11-18' });
    let r = await driveRefresh(saved, Object.assign({}, base, { startDate: null }));
    check('a refresh answering startDate null keeps the saved date (stored)', r.stored === '2026-11-18', r);
    check('and in use', r.used === '2026-11-18', r);
    r = await driveRefresh(saved, Object.assign({}, base, { startDate: '' }));
    check('a refresh answering "" replaces it', r.stored === '' && r.used === '', r);
    r = await driveRefresh(saved, Object.assign({}, base, { startDate: '2026-12-02' }));
    check('a refresh answering a different date replaces it', r.stored === '2026-12-02' && r.used === '2026-12-02', r);
    r = await driveRefresh(base, Object.assign({}, base, { startDate: null }));
    check('with nothing saved, a null answer stays null', r.stored === null && r.used === null, r);
  }

  console.log('\n[i] the real arrival.js shows and hides the Start row');
  {
    const p = load({ saved: 'Romina' });
    check('with no date the Start row is hidden', p.dateHidden() && p.date() === '', { date: p.date() });
    p.setStart('2026-11-18');
    check('a published date shows the row', p.dateShown(), { date: p.date() });
    check('and reads "11  .  18  .  2026"', p.date() === '11  .  18  .  2026', p.date());
    p.setStart(undefined);
    check('clearing the date hides the row again', p.dateHidden() && p.date() === '', { date: p.date() });
  }

  console.log('\n[j] app.js boot: the saved kit dresses the page until a fresh one lands');
  {
    const romina = { name: 'Romina', firstName: 'Romina', startDate: '2026-11-18', plan: null, syncWith: [] };
    const karishma = { name: 'Karishma', firstName: 'Karishma', startDate: '2026-12-07', plan: null, syncWith: [] };
    const probe = bootPage({});
    check('seedKitFromSaved is found in app.js', probe.has('seedKitFromSaved'));
    check('the boot line is found in app.js', probe.bootFound);

    for (const outcome of ['reject', 'notok']) {
      const label = outcome === 'reject' ? 'the refresh is offline' : 'the refresh is refused';
      const p = bootPage({ saved: { code: 'c-romina', data: romina } });
      check(label + ': at boot the saved kit is in use', p.kit() && p.kit().name === 'Romina', p.kit());
      check(label + ': the hub was dressed with it once', JSON.stringify(p.calls.apply) === '["Romina"]', p.calls.apply);
      check(label + ': My onboarding was mounted with it once', JSON.stringify(p.calls.mount) === '["Romina"]', p.calls.mount);
      check(label + ': carrara:kit-updated fired once', p.events.filter((e) => e === 'carrara:kit-updated').length === 1, p.events);
      check(label + ': the saved first day reaches the ticket', p.date() === '2026-11-18', p.date());
      check(label + ': seeding does not dispatch carrara:kit-settled', p.events.indexOf('carrara:kit-settled') < 0, p.events);
      check(label + ': the refresh still asks with the saved code', p.asks.length === 1 && p.asks[0].code === 'c-romina', p.asks.length);
      await p.answer(0, outcome);
      check(label + ': after it fails the saved kit still stands', p.kit() && p.kit().name === 'Romina', p.kit());
      check(label + ': and nothing was dressed twice', p.calls.apply.length === 1 && p.calls.mount.length === 1, p.calls);
    }

    {
      const p = bootPage({});
      check('nothing saved: nothing is seeded', p.kit() === null, p.kit());
      check('nothing saved: nothing is dressed or mounted', p.calls.apply.length === 0 && p.calls.mount.length === 0, p.calls);
      check('nothing saved: no event', p.events.length === 0, p.events);
      check('nothing saved: no first day', p.date() === undefined, p.date());
    }

    for (const [label, saved] of [
      ['a saved kit with no data', { code: 'c-romina' }],
      ['a saved kit whose data is a string', { code: 'c-romina', data: 'Romina' }],
      ['a saved kit whose data is a list', { code: 'c-romina', data: ['Romina'] }]
    ]) {
      const p = bootPage({ saved });
      check(label + ': nothing is seeded', p.kit() === null, p.kit());
      check(label + ': nothing is dressed and no event', p.calls.apply.length === 0 && p.events.length === 0, { calls: p.calls, events: p.events });
      await p.answer(0, 'reject');
      check(label + ': nor after the refresh fails', p.kit() === null && p.events.length === 0, { kit: p.kit(), events: p.events });
    }

    for (const outcome of ['reject', 'notok']) {
      const label = outcome === 'reject' ? '(offline)' : '(refused)';
      const p = bootPage({ saved: { code: 'c-karishma', data: karishma }, link: 'romina' });
      check('Karishma saved, a link for Romina in flight ' + label + ': at boot nothing is seeded (the forbidden case)',
        p.kit() === null, p.kit());
      check('  nothing is dressed or mounted with Karishma', p.calls.apply.length === 0 && p.calls.mount.length === 0, p.calls);
      check('  no carrara:kit-updated while the link is looked up', p.events.indexOf('carrara:kit-updated') < 0, p.events);
      check('  Karishma\'s first day is not on the ticket', p.date() === undefined, p.date());
      check('  only the link is asked about, not the saved code', p.asks.length === 1 && p.asks[0].code === 'romina', p.asks.map((a) => a.code));
      await p.answer(0, outcome);
      check('  once the link fails and settles, the saved kit is used', p.kit() && p.kit().name === 'Karishma', p.kit());
      check('  dressed and mounted once', JSON.stringify(p.calls.apply) === '["Karishma"]' && JSON.stringify(p.calls.mount) === '["Karishma"]', p.calls);
      check('  its first day reaches the ticket', p.date() === '2026-12-07', p.date());
      check('  settled exactly once, then updated (no loop)',
        JSON.stringify(p.events.filter((e) => e.indexOf('carrara:kit-') === 0)) === JSON.stringify(['carrara:kit-settled', 'carrara:kit-updated']), p.events);
    }

    {
      const p = bootPage({ saved: { code: 'c-karishma', data: karishma }, link: 'romina' });
      await p.answer(0, romina);
      check('the link lookup succeeds: the link\'s kit is in use', p.kit() && p.kit().name === 'Romina', p.kit());
      check('  the settle after it does not put Karishma back', JSON.stringify(p.calls.apply) === '["Romina"]', p.calls.apply);
      check('  Romina\'s first day is on the ticket', p.date() === '2026-11-18', p.date());
      check('  one update, one settle',
        JSON.stringify(p.events.filter((e) => e.indexOf('carrara:kit-') === 0)) === JSON.stringify(['carrara:kit-updated', 'carrara:kit-settled']), p.events);
    }

    {
      const p = bootPage({ saved: { code: 'c-romina', data: romina } });
      const fresh = Object.assign({}, romina, { firstName: 'Romi', startDate: '2026-12-02' });
      await p.answer(0, fresh);
      check('a refresh that answers after a seed replaces the seeded kit', p.kit() && p.kit().firstName === 'Romi', p.kit());
      check('  with its own first day', p.date() === '2026-12-02', p.date());
      check('  dressed twice: the seed, then the fresh kit', JSON.stringify(p.calls.apply) === '["Romina","Romina"]' && p.kit().firstName === 'Romi', p.calls.apply);
      check('  and never settled', p.events.indexOf('carrara:kit-settled') < 0, p.events);
    }

    // The checklist is read once per load. Each read is a call through to POps,
    // and a second one queued behind the first throws the first answer away.
    const unknown = () => ({ status: 200, body: { role: 'unknown' } });
    {
      const p = bootPage({ saved: { code: 'c-romina', data: romina }, checklist: unknown });
      await p.flush();
      check('a saved kit and no link: exactly one checklist read before the refresh answers',
        JSON.stringify(p.chkAsks) === '["c-romina"]', p.chkAsks);
    }
    {
      const p = bootPage({ checklist: unknown });
      await p.flush();
      check('nothing saved: the checklist asks nothing, as before', p.chkAsks.length === 0, p.chkAsks);
      check('  and stays in the browser\'s own mode', p.chkMode() === 'local', p.chkMode());
    }
    {
      const p = bootPage({ saved: { code: 'c-romina' }, checklist: unknown });
      await p.flush();
      check('a saved code with no kit (nothing seeded): the boot still decides the checklist, once',
        JSON.stringify(p.chkAsks) === '["c-romina"]', p.chkAsks);
    }
    {
      const p = bootPage({ saved: { code: 'c-karishma', data: karishma }, link: 'romina', checklist: unknown });
      await p.flush();
      check('a link in flight: the checklist asks nothing until the lookup settles', p.chkAsks.length === 0, p.chkAsks);
      await p.answer(0, 'reject');
      check('  once it settles, the checklist asks for the saved code', p.chkAsks.length >= 1 && p.chkAsks.every((c) => c === 'c-karishma'), p.chkAsks);
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
