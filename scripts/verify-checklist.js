// Verifies checklist progress saved in POps (roadmap #114), without a server,
// a browser or a test runner (this repo has no package.json on purpose).
//
//   node scripts/verify-checklist.js
//
// It drives checklist-sync.js (the page's decisions, no DOM) and the
// api/checklist.js handler (with a stubbed fetch standing in for POps and
// hand-signed session cookies) and checks:
//   1. ids       every CHECKLIST item id in app.js fits the contract's id rule
//   2. modes     local, hire and viewer from what /api/checklist answers
//   3. loads     first sync is a union and is saved; later loads take POps'
//                answer; "not saved yet" sends the browser's ticks instead
//   4. viewer    never saves and never touches the browser's own ticks
//   5. payload   ids without the k: prefix, labels, total, CHECKLIST order
//   6. saver     800 ms debounce, one save in flight, the latest state wins,
//                a refusal stops it
//   7. handler   the email comes from the session only; every non-answer is
//                { role: "unknown" }; a refused save is 403 { refused: true };
//                only role, done, total and updated_at reach the browser;
//                no email, code or token in anything it logs or returns
//   8. page      app.js's own functions, cut out of the file and run with DOM
//                stubs: the ending never plays for a viewer or on a load,
//                the reset is a no-op for a viewer and saves for the hire,
//                the cover list and page marks are read only for a viewer
// Exits non-zero when any check fails. Every person, email, code and secret
// here is invented and set inside this file.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

// A verifier that STOPS EARLY must never look like a verifier that passed.
let finished = false;
process.on('exit', (code) => {
  if (!finished && code === 0) {
    console.error('\nFAILED: the verifier exited before finishing: something awaited never settled');
    process.exitCode = 1;
  }
});

// Fixed test values, never inherited from the shell, set before anything loads.
const AUTH = 'verify-checklist-auth-secret';
const TOKEN = 'verify-checklist-pops-token';
process.env.GOOGLE_CLIENT_ID = 'verify-checklist-client-id';
process.env.AUTH_SECRET = AUTH;
delete process.env.GOOGLE_CLIENT_SECRET;
process.env.WELCOME_SECRET = 'verify-checklist-welcome-secret';
process.env.POPS_PLAN_TOKEN = TOKEN;
delete process.env.POPS_PROGRESS_URL;

const CS = require('../checklist-sync.js');
const handler = require('../api/checklist.js');
const welcome = require('../api/welcome.js');

let failures = 0;
let count = 0;
function check(label, cond, detail) {
  count++;
  if (cond) console.log('  ok   ' + label);
  else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ------------------------------------------------------------ fixtures
// The CHECKLIST as app.js ships it, read out of the file and evaluated alone.
function loadChecklist() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = src.indexOf('var CHECKLIST = [');
  const end = src.indexOf('\n  ];\n', start);
  if (start < 0 || end < 0) return null;
  const sandbox = { window: { LINKS: { emailSigTemplate: 'https://example.com/sig' } } };
  vm.runInNewContext(src.slice(start, end + 5) + '\nthis.CHECKLIST = CHECKLIST;', sandbox);
  return sandbox.CHECKLIST;
}

// app.js itself, for the [page] checks: a function is cut out of the file by
// name and run in a sandbox, so what is tested is what ships.
function appSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
}
// From `from` (an index at or before an opening brace), the index just past
// the matching closing brace. Skips strings and comments; the functions cut
// out here hold no regex literals (esc is supplied separately for that reason).
function braceEnd(src, from) {
  let i = src.indexOf('{', from), depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '\'' || c === '"' || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return i + 1;
  }
  throw new Error('unbalanced braces from ' + from);
}
function fnSrc(src, name) {
  const at = src.indexOf('function ' + name + '(');
  if (at < 0) throw new Error('app.js has no function ' + name);
  return src.slice(at, braceEnd(src, src.indexOf(')', at))) + '\n';
}
// The same, or '' when app.js does not have it (so a missing helper fails a
// check instead of stopping the verifier).
function optFn(src, name) {
  return src.indexOf('function ' + name + '(') < 0 ? '' : fnSrc(src, name);
}
// An anonymous handler: the function passed right after `lead`.
function handlerSrc(src, lead) {
  const at = src.indexOf(lead);
  if (at < 0) throw new Error('app.js has no ' + lead);
  const f = at + lead.length;
  return src.slice(f, braceEnd(src, src.indexOf(')', f)));
}
function sandbox(stubs) {
  const sb = {
    window: {}, CS, chkMode: 'local', chkState: {},
    $: () => null, $$: () => [],
    esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  };
  Object.assign(sb, stubs);
  const data = {};
  vm.createContext(sb);
  // app.js's store(k) reads and store(k, v) writes; here it writes to sb.store
  vm.runInContext('function store(k, v) { if (v === undefined) return k in __data ? __data[k] : null; __data[k] = JSON.parse(JSON.stringify(v)); }', Object.assign(sb, { __data: data }));
  return sb;
}
function run(sb, code, extra) {
  if (extra) Object.assign(sb, extra);
  return vm.runInContext(code, sb);
}
// Just enough of an element for the functions above.
function fakeEl() {
  const classes = new Set();
  const el = {
    className: '', innerHTML: '', children: [], parentNode: null, attrs: {}, buttons: {},
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c), contains: (c) => classes.has(c),
      toggle: (c, on) => { if (on === undefined) on = !classes.has(c); if (on) classes.add(c); else classes.delete(c); return on; },
    },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    removeAttribute(k) { delete el.attrs[k]; },
    appendChild(c) { c.parentNode = el; el.children.push(c); return c; },
    removeChild(c) { el.children = el.children.filter((x) => x !== c); c.parentNode = null; return c; },
    querySelector(sel) {
      if (sel.charAt(0) === '.') return el.children.find((c) => (' ' + c.className + ' ').indexOf(' ' + sel.slice(1) + ' ') > -1) || null;
      if (sel.charAt(0) === '#' && el.innerHTML.indexOf('id="' + sel.slice(1) + '"') > -1) {
        if (!el.buttons[sel]) {
          const ls = [];
          el.buttons[sel] = { addEventListener: (t, f) => { if (t === 'click') ls.push(f); }, ls };
        }
        return el.buttons[sel];
      }
      return null;
    },
    fire(sel) { const b = el.buttons[sel]; if (b) b.ls.forEach((f) => f({ preventDefault() {} })); },
  };
  return el;
}

// An access code minted the way api/mint.js mints one (seven fields), signed
// with this file's WELCOME_SECRET.
function code(planKey) {
  const fields = ['Ada Lovelace', 'US', 'talent', '', 'Grace Hopper', 'U000TEST', planKey];
  const b64 = Buffer.from(fields.map(encodeURIComponent).join('|')).toString('base64url');
  return b64 + '.' + crypto.createHmac('sha256', process.env.WELCOME_SECRET).update(b64).digest('hex').slice(0, 10);
}

// A hub_session cookie signed the way api/_lib/signin.js signs it.
function session(email, opts) {
  const t = Math.floor(Date.now() / 1000);
  const o = Object.assign({ iat: t - 60, seen: t - 60, exp: t - 60 + 24 * 3600, secret: AUTH }, opts || {});
  const body = Buffer.from(JSON.stringify({ email, name: 'Someone', iat: o.iat, seen: o.seen, exp: o.exp })).toString('base64url');
  return 'hub_session=' + body + '.' + crypto.createHmac('sha256', o.secret).update(body).digest('base64url');
}

function fakeRes() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

// POps, stubbed: each call is recorded and answered by `answer`.
let calls = [];
let answer = () => ({ status: 200, body: { role: 'unknown' } });
global.fetch = async (url, init) => {
  const call = { url, init, body: init && init.body ? JSON.parse(init.body) : null };
  calls.push(call);
  const a = await answer(call);
  if (a instanceof Error) throw a;
  return {
    ok: a.status >= 200 && a.status < 300,
    status: a.status,
    json: async () => { if (a.raw !== undefined) return JSON.parse(a.raw); return a.body; }
  };
};

// Everything the handler writes to the console, to prove it writes nothing secret.
const logged = [];
['log', 'info', 'warn', 'error', 'debug'].forEach((k) => {
  const orig = console[k];
  console[k] = function () {
    if (capturing) logged.push(Array.prototype.map.call(arguments, String).join(' '));
    return orig.apply(console, arguments);
  };
});
let capturing = false;
const returned = [];

async function call(body, cookie, opts) {
  const req = { method: (opts && opts.method) || 'POST', headers: cookie ? { cookie } : {}, body };
  const res = fakeRes();
  capturing = true;
  try { await handler(req, res); } finally { capturing = false; }
  returned.push(JSON.stringify({ status: res.statusCode, body: res.body, headers: res.headers }));
  return res;
}

async function main() {
  // ------------------------------------------------------------ ids
  console.log('\n[ids] every checklist item fits the POps id rule');
  const CHECKLIST = loadChecklist();
  check('app.js CHECKLIST was found and evaluated', Array.isArray(CHECKLIST) && CHECKLIST.length > 0);
  const items = CS.itemsOf(CHECKLIST || []);
  const keys = items.map((i) => 'k:' + i.id);
  check('the checklist has items', items.length > 0, items.length);
  const badIds = items.filter((i) => !/^[a-z0-9][a-z0-9-]{0,63}$/.test(i.id)).map((i) => i.id);
  check('every item id matches ^[a-z0-9][a-z0-9-]{0,63}$', badIds.length === 0, badIds);
  check('CS.ID_RE is the contract rule', String(CS.ID_RE) === String(/^[a-z0-9][a-z0-9-]{0,63}$/));
  check('ids are unique', new Set(items.map((i) => i.id)).size === items.length);
  check('at most 100 items, total within 0 to 200', items.length <= 100 && items.length <= 200, items.length);
  const badLabels = items.filter((i) => typeof i.t !== 'string' || i.t.length < 1 || i.t.length > 160).map((i) => i.id);
  check('every title is 1 to 160 characters', badLabels.length === 0, badLabels);
  const fullSave = CS.savePayload(Object.fromEntries(keys.map((k) => [k, true])), items);
  check('a save of the whole real list fits POps: every id and label, at most 100 done, total at most 200',
    fullSave.done.length === items.length && fullSave.done.length <= 100 && fullSave.total <= 200
    && fullSave.done.every((d) => CS.ID_RE.test(d.id) && d.label.length >= 1 && d.label.length <= 160), fullSave.total);

  // ------------------------------------------------------------ modes
  console.log('\n[modes] what decides local, hire and viewer');
  check('no answer is local', CS.modeOf(null) === 'local');
  check('a non-object is local', CS.modeOf('hire') === 'local' && CS.modeOf([1]) === 'local');
  check('role unknown is local', CS.modeOf({ role: 'unknown' }) === 'local');
  check('a refusal is local', CS.modeOf({ refused: true }) === 'local');
  check('any other role is local', CS.modeOf({ role: 'admin', done: {} }) === 'local');
  check('role hire is hire', CS.modeOf({ role: 'hire', done: {}, total: 17 }) === 'hire');
  check('role viewer is viewer', CS.modeOf({ role: 'viewer', done: {}, total: 17 }) === 'viewer');

  // ------------------------------------------------------------ loads
  console.log('\n[loads] first sync, later loads, and "not saved yet"');
  const local = { 'k:slack': true, 'k:payroll': true, 'k:payroll-old': true, 'k:i9': false };
  const remote = { role: 'hire', done: { slack: '2026-11-10T10:00:00Z', quarry: '2026-11-11T10:00:00Z', 'not-an-item': '2026-11-11T10:00:00Z' }, total: items.length, updated_at: '2026-11-11T10:00:00Z' };

  const first = CS.decideLoad({ answer: remote, local, keys, synced: false, pending: false });
  check('first sync: mode hire', first.mode === 'hire');
  check('first sync: the union of the browser and POps', same(Object.keys(first.state).sort(), ['k:payroll', 'k:quarry', 'k:slack']), first.state);
  check('first sync: it is saved', first.save === true);
  check('first sync: an id POps sends that is not an item is dropped', !('k:not-an-item' in first.state));

  const later = CS.decideLoad({ answer: remote, local, keys, synced: true, pending: false });
  check('later load: POps\' answer, not the browser\'s', same(Object.keys(later.state).sort(), ['k:quarry', 'k:slack']), later.state);
  check('later load: nothing is saved', later.save === false);
  const untickedRemotely = CS.decideLoad({ answer: { role: 'hire', done: {}, total: items.length }, local, keys, synced: true, pending: false });
  check('later load: an untick saved from another device wins', same(untickedRemotely.state, {}), untickedRemotely.state);

  const pend = CS.decideLoad({ answer: remote, local, keys, synced: true, pending: true });
  check('not saved yet: the browser\'s ticks, not POps\' older answer', same(Object.keys(pend.state).sort(), ['k:payroll', 'k:slack']), pend.state);
  check('not saved yet: they are sent', pend.save === true);

  const loc = CS.decideLoad({ answer: { role: 'unknown' }, local, keys, synced: true, pending: true });
  check('local: the browser\'s own object, untouched', loc.mode === 'local' && loc.state === local && loc.save === false);
  const locNull = CS.decideLoad({ answer: null, local, keys, synced: false, pending: false });
  check('local on failure: the browser\'s own ticks, nothing saved', locNull.mode === 'local' && locNull.state === local && locNull.save === false);

  check('flags: set only for the same code', CS.flagSet('c1', 'c1') && !CS.flagSet('c1', 'c2') && !CS.flagSet(null, 'c1') && !CS.flagSet(true, 'c1'));

  // ------------------------------------------------------------ viewer
  console.log('\n[viewer] read only, and the browser\'s ticks stay out of it');
  const localBefore = JSON.stringify(local);
  const view = CS.decideLoad({ answer: { role: 'viewer', done: { quarry: '2026-11-11T10:00:00Z' }, total: items.length }, local, keys, synced: false, pending: true });
  check('viewer: mode viewer', view.mode === 'viewer');
  check('viewer: shows the hire\'s ticks only, none of the browser\'s', same(view.state, { 'k:quarry': true }), view.state);
  check('viewer: never saves, even with the flags set', view.save === false);
  check('viewer: the browser\'s ticks object is not changed', JSON.stringify(local) === localBefore);
  check('viewer: the state is a new object, not the browser\'s', view.state !== local);
  check('viewer sentence', CS.ownerNote('Ada') === 'This is Ada\'s checklist. Only Ada can tick items.', CS.ownerNote('Ada'));
  check('viewer sentence without a name', CS.ownerNote('') === 'This is someone else\'s checklist. Only they can tick items.', CS.ownerNote(''));
  check('viewer title', CS.ownerTitle && CS.ownerTitle('Ada') === 'Ada\'s checklist', CS.ownerTitle && CS.ownerTitle('Ada'));
  check('viewer title without a name', CS.ownerTitle && CS.ownerTitle('  ') === 'Their checklist', CS.ownerTitle && CS.ownerTitle('  '));
  check('viewer intro line', CS.ownerOnly && CS.ownerOnly(' Ada ') === 'Only Ada can tick items.', CS.ownerOnly && CS.ownerOnly(' Ada '));
  check('viewer intro line without a name', CS.ownerOnly && CS.ownerOnly(null) === 'Only they can tick items.', CS.ownerOnly && CS.ownerOnly(null));
  check('no em dash in any viewer sentence', !/—/.test(CS.ownerNote('Ada') + CS.ownerNote('') + (CS.ownerTitle ? CS.ownerTitle('Ada') + CS.ownerTitle('') + CS.ownerOnly('Ada') + CS.ownerOnly('') : '')));

  // ------------------------------------------------------------ page
  // The parts of app.js that tick, run for real: each function is cut out of
  // the shipped file and evaluated in a sandbox with stubs for the DOM.
  console.log('\n[page] the cover, the page marks and the ending, in each mode');
  const APP = appSource();
  check('app.js has no conflict markers', !/^(<<<<<<<|=======|>>>>>>>)/m.test(APP));

  // renderProgress + setChecklistMode + the reset: the ending and DONE_SEEN
  function progressBox(mode, doneKeys, last) {
    const sb = sandbox({
      chkMode: mode, flat: keys.slice(), current: null, MO: { SECTION_ID: 'my-onboarding' },
      chkState: Object.fromEntries(doneKeys.map((k) => [k, true])),
      renderCoverChecklist() {}, mountMyOnboarding() {},
      doneMoment() { sb.moments++; }, moments: 0,
      queueChecklistSave() { sb.saves++; }, saves: 0,
      chkSaver: null, chkPop: { classList: { toggle() {} } },
      $: () => ({ style: {}, textContent: '' }),
    });
    run(sb, 'var DONE_SEEN = \'carrara_done_seen\'; var lastPct = ' + JSON.stringify(last) + ';');
    run(sb, fnSrc(APP, 'chkCount') + fnSrc(APP, 'renderProgress') + fnSrc(APP, 'setChecklistMode')
      + 'function paintChecklist() { renderProgress(); }'
      + 'var resetHandler = ' + handlerSrc(APP, "$('#chk-reset').addEventListener('click', ") + ';');
    return sb;
  }
  let pb = progressBox('local', keys.slice(0, -1), 96);
  pb.chkState[keys[keys.length - 1]] = true; run(pb, 'renderProgress()');
  check('local: the last tick plays the ending once and records it', pb.moments === 1 && pb.__data.carrara_done_seen === true, { m: pb.moments, s: pb.__data });
  pb = progressBox('hire', keys.slice(0, -1), 96);
  pb.chkState[keys[keys.length - 1]] = true; run(pb, 'renderProgress()');
  check('hire: the last tick plays the ending', pb.moments === 1);
  pb = progressBox('viewer', keys.slice(0, -1), 96);
  pb.chkState[keys[keys.length - 1]] = true; run(pb, 'renderProgress()');
  check('viewer: reaching 100% never plays the ending', pb.moments === 0, pb.moments);
  check('viewer: DONE_SEEN is never written', !('carrara_done_seen' in pb.__data), pb.__data);
  pb = progressBox('local', keys.slice(0, 3), 13);
  run(pb, 'renderProgress()');
  run(pb, 'setChecklistMode(\'hire\', ' + JSON.stringify(Object.fromEntries(keys.map((k) => [k, true]))) + ')');
  check('a load of POps\' finished list never plays the ending', pb.moments === 0, pb.moments);
  check('and leaves DONE_SEEN alone', !('carrara_done_seen' in pb.__data), pb.__data);
  run(pb, 'setChecklistMode(\'viewer\', {}); setChecklistMode(\'viewer\', ' + JSON.stringify(Object.fromEntries(keys.map((k) => [k, true]))) + ')');
  check('nor does a viewer\'s state swap', pb.moments === 0, pb.moments);
  pb = progressBox('viewer', keys.slice(0, 2), 9);
  pb.__data.carrara_checklist = { mine: true };
  run(pb, 'resetHandler()');
  check('reset in viewer mode changes nothing', same(Object.keys(pb.chkState).sort(), keys.slice(0, 2).sort()) && same(pb.__data, { carrara_checklist: { mine: true } }) && pb.saves === 0, { st: pb.chkState, s: pb.__data });
  pb = progressBox('hire', keys.slice(0, 2), 9);
  run(pb, 'resetHandler()');
  check('reset in hire mode clears, forgets the ending and saves', same(pb.chkState, {}) && pb.__data.carrara_done_seen === false && pb.saves === 1, { st: pb.chkState, s: pb.__data, saves: pb.saves });
  pb = progressBox('local', keys.slice(0, 2), 9);
  run(pb, 'resetHandler()');
  check('reset in local mode clears and does not save to POps', same(pb.chkState, {}) && pb.saves === 0);

  // the cover list
  function coverBox(mode, first) {
    const box = fakeEl();
    const sb = sandbox({
      chkMode: mode, flat: keys.slice(), CHECKLIST, justTicked: [],
      chkState: { [keys[0]]: true },
      kitData: { firstName: first },
      ctaHtml() { return '<a class="btn-cover" id="btn-tour" href="#/x">Continue</a>'; },
      ckOpenState() { return {}; },
      coverGoes() { return { how: 'page', key: 'x' }; },
      $: (sel) => (sel === '#cover-checklist' ? box : null),
    });
    run(sb, 'var chkCode = null;' + optFn(APP, 'checklistOwnerFirst') + fnSrc(APP, 'chkCount') + fnSrc(APP, 'coverRow') + fnSrc(APP, 'renderCoverChecklist') + 'renderCoverChecklist();');
    return box;
  }
  const localCover = coverBox('local', 'Ada');
  const viewCover = coverBox('viewer', 'Ada');
  const anonCover = coverBox('viewer', '');
  const evilCover = coverBox('viewer', '<i>x</i>');
  const boxesOf = (h) => h.match(/<span class="ck-box"[^>]*>/g) || [];
  check('local cover: "Your checklist", the call to action, live boxes', /Your checklist/.test(localCover.innerHTML) && /btn-tour/.test(localCover.innerHTML)
    && boxesOf(localCover.innerHTML).every((b) => /tabindex="0"/.test(b) && !/aria-disabled/.test(b)) && !localCover.classList.has('is-readonly'));
  check('viewer cover: titled "Ada\'s checklist"', /<h2 class="ck-title">Ada's checklist<\/h2>/.test(viewCover.innerHTML), viewCover.innerHTML.slice(0, 200));
  check('viewer cover: "Only Ada can tick items."', /Only Ada can tick items\./.test(viewCover.innerHTML) && !/Tick each one off/.test(viewCover.innerHTML));
  check('viewer cover: never "Your checklist"', !/Your checklist/.test(viewCover.innerHTML));
  check('viewer cover: the intro is only the owner sentence', /<p class="ck-intro">Only Ada can tick items\.<\/p>/.test(viewCover.innerHTML) && !/set yourself up/.test(viewCover.innerHTML), (viewCover.innerHTML.match(/<p class="ck-intro">[^<]*<\/p>/) || [])[0]);
  check('local cover: the intro is main\'s two sentences', /<p class="ck-intro">We put this list together so you can set yourself up for success\. Tick each one off as you go\.<\/p>/.test(localCover.innerHTML));
  check('viewer cover: a box is labelled with the title only', boxesOf(viewCover.innerHTML).every((b) => !/aria-label="Mark /.test(b)) && /aria-label="Who we are"/.test(viewCover.innerHTML), boxesOf(viewCover.innerHTML)[0]);
  check('local cover: a box still says "Mark ... done"', /aria-label="Mark Who we are done"/.test(localCover.innerHTML));
  check('viewer cover: no call to action', !/btn-tour/.test(viewCover.innerHTML));
  check('viewer cover: every box is aria-disabled with no tabindex', boxesOf(viewCover.innerHTML).length === keys.length
    && boxesOf(viewCover.innerHTML).every((b) => /aria-disabled="true"/.test(b) && !/tabindex/.test(b)), boxesOf(viewCover.innerHTML)[0]);
  check('viewer cover: marked read only for the CSS', viewCover.classList.has('is-readonly'));
  check('viewer cover: the hire\'s count', /<b>1 of 23<\/b>|<b>1 of \d+<\/b>/.test(viewCover.innerHTML));
  check('viewer cover without a name: "Their checklist" and "Only they"', /Their checklist/.test(anonCover.innerHTML) && /Only they can tick items\./.test(anonCover.innerHTML));
  check('viewer cover escapes the name', evilCover.innerHTML.indexOf('<i>x</i>') === -1 && evilCover.innerHTML.indexOf('&lt;i&gt;x&lt;/i&gt;') > -1);
  check('no em dash on the viewer cover', !/—/.test(viewCover.innerHTML + anonCover.innerHTML));

  // the cover's delegated click
  function actBox(mode, onBox) {
    const calls = [];
    const sb = sandbox({ chkMode: mode, justTicked: [] });
    sb.itemApi = { slack: { toggle() { calls.push(['toggle', sb.justTicked.slice()]); }, details() { calls.push(['details']); } } };
    run(sb, fnSrc(APP, 'act'));
    const row = { getAttribute: () => 'slack' };
    const target = { closest: (s) => (s === '.ck-row' ? row : s === '.ck-box' ? (onBox ? {} : null) : s === '[data-open]' ? (onBox ? null : {}) : null) };
    sb.act({ type: 'click', target, preventDefault() {} });
    sb.act({ type: 'keydown', key: 'Enter', target, preventDefault() {} });
    return { calls, sb };
  }
  let ab = actBox('local', true);
  check('local cover: a box click and Enter tick, with the strike armed', same(ab.calls, [['toggle', ['slack']], ['toggle', ['slack']]]), ab.calls);
  ab = actBox('viewer', true);
  check('viewer cover: a box click or Enter does nothing', ab.calls.length === 0 && same(ab.sb.justTicked, []), ab.calls);
  ab = actBox('viewer', false);
  check('viewer cover: opening an item still works', same(ab.calls, [['details']]), ab.calls);

  // the page marks
  function markBox(mode, opts) {
    const root = fakeEl();
    const grp = { g: 'Start here', items: [{ id: 'slack', t: 'Slack' }, { id: 'payroll', t: 'Payroll' }] };
    const toggles = [];
    const sb = sandbox({
      chkMode: mode, justTicked: [],
      chkState: Object.fromEntries((opts.done || []).map((id) => ['k:' + id, true])),
      location: { hash: '#/page' }, timers: 0,
      setTimeout() { sb.timers++; },
      sectionOfPage: () => grp, sectionIsARead: () => !!opts.read,
      itemOfPage: () => grp.items[0], openGroupOf() {},
      pagesOfSection: () => [{ sec: 'one' }, { sec: 'two' }],
      SECTIONS: [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }],
      itemApi: { slack: { toggle() { toggles.push('slack'); } }, payroll: { toggle() { toggles.push('payroll'); } } },
      document: { createElement: () => fakeEl() },
    });
    run(sb, fnSrc(APP, 'pageMark') + fnSrc(APP, 'nextNav'));
    return { root, sb, toggles, html: () => root.children.map((c) => c.innerHTML).join('') };
  }
  let mb = markBox('viewer', { done: [] });
  run(mb.sb, 'pageMark(__root, "one")', { __root: mb.root });
  check('viewer page, not done: no mark at all', mb.root.children.length === 0, mb.html());
  mb = markBox('viewer', { done: ['slack'] });
  run(mb.sb, 'pageMark(__root, "one")', { __root: mb.root });
  const vmark = mb.html();
  check('viewer page, done: the Completed mark, disabled', /Completed/.test(vmark) && /\bdisabled\b/.test(vmark) && /aria-disabled="true"/.test(vmark) && !/Mark as completed/.test(vmark), vmark);
  mb.root.children.forEach((c) => c.fire('#page-done'));
  check('and pressing it does nothing', mb.toggles.length === 0 && mb.sb.location.hash === '#/page' && mb.sb.timers === 0, mb.toggles);
  mb = markBox('local', { done: [] });
  run(mb.sb, 'pageMark(__root, "one")', { __root: mb.root });
  check('local page: "Mark as completed", a live button', /Mark as completed/.test(mb.html()) && !/disabled/.test(mb.html()));
  mb.sb.chkMode = 'viewer';
  mb.root.children.forEach((c) => c.fire('#page-done'));
  check('a mark drawn before the mode turned viewer does nothing when pressed', mb.toggles.length === 0 && mb.sb.location.hash === '#/page' && mb.sb.timers === 0);
  mb = markBox('local', { done: ['slack'] });
  run(mb.sb, 'pageMark(__root, "one")', { __root: mb.root });
  mb.sb.chkMode = 'viewer';
  mb.root.children.forEach((c) => c.fire('#page-done'));
  check('nor does a Completed mark drawn before the mode turned viewer', mb.toggles.length === 0);

  for (const [label, o] of [['a read, nothing done', { read: true, done: [] }], ['a read, all done', { read: true, done: ['slack', 'payroll'] }]]) {
    mb = markBox('viewer', o);
    run(mb.sb, 'nextNav(__root, "two")', { __root: mb.root });
    const h = mb.html();
    check('viewer, last page, ' + label + ': no tick button', !/section-done|Mark section as completed|Mark as completed/.test(h), h);
    check('viewer, last page, ' + label + ': "Back to the checklist" to #/start', /href="#\/start"[^>]*>[\s\S]*Back to the checklist/.test(h), h);
  }
  // the "partly a read" foot: a section that is not a read but whose pager is drawn
  mb = markBox('viewer', { read: true, done: [] });
  const asks = [false, true, false];
  mb.sb.sectionIsARead = () => asks.shift();
  // pageMark asks first (false: draw the page mark), nextNav asks second (true:
  // draw the pager), the foot asks third (false: the partly-a-read foot)
  run(mb.sb, 'nextNav(__root, "two")', { __root: mb.root });
  check('viewer, partly a read: "Back to the checklist", never "your"', /Back to the checklist/.test(mb.html()) && !/Back to your checklist/.test(mb.html()), mb.html());
  mb = markBox('local', { read: true, done: [] });
  run(mb.sb, 'nextNav(__root, "two")', { __root: mb.root });
  check('local, last page of a read: the section door', /id="section-done"/.test(mb.html()));
  mb.sb.chkMode = 'viewer';
  mb.root.children.forEach((c) => c.fire('#section-done'));
  check('a section door drawn before the mode turned viewer does nothing when pressed', mb.toggles.length === 0 && mb.sb.location.hash === '#/page' && mb.sb.timers === 0, mb.toggles);

  // a mode change redraws the marks of the page on screen
  {
    const view = fakeEl();
    const navs = [];
    const sb = sandbox({
      chkMode: 'local', chkState: {}, current: 'two', chkSaver: null, kitData: null,
      chkPop: { classList: { toggle() {} } },
      $: (sel) => (sel === '#view-two' ? view : null), $$: () => [],
      renderProgress() {}, nextNav(root, sec) { navs.push([root === view, sec]); },
    });
    run(sb, 'var lastPct = 50;' + fnSrc(APP, 'paintChecklist') + fnSrc(APP, 'setChecklistMode') + 'setChecklistMode("viewer", {});');
    check('a mode change redraws the open page\'s marks', same(navs, [[true, 'two']]), navs);
    navs.length = 0; sb.current = 'start';
    run(sb, 'setChecklistMode("local", {});');
    check('and leaves the start page alone', navs.length === 0, navs);
  }

  // the owner's name before /api/welcome has answered: the saved kit's, but
  // only when it is the kit the mode was decided for
  function ownerBox(savedCode, decidedFor) {
    const box = fakeEl();
    const owner = { hidden: true, textContent: '' };
    const sb = sandbox({
      chkMode: 'viewer', flat: keys.slice(), CHECKLIST, justTicked: [], chkState: {},
      kitData: null, current: null, chkSaver: null,
      chkPop: { classList: { toggle() {} } },
      ctaHtml() { return ''; }, ckOpenState() { return {}; }, coverGoes() { return null; },
      $: (sel) => (sel === '#cover-checklist' ? box : sel === '#chk-owner' ? owner : null),
      renderProgress() {}, nextNav() {},
    });
    run(sb, 'store("carrara_welcome", ' + JSON.stringify({ code: savedCode, data: { firstName: 'Ada' } }) + ');'
      + 'var chkCode = ' + JSON.stringify(decidedFor) + ';'
      + optFn(APP, 'checklistOwnerFirst') + fnSrc(APP, 'chkCount') + fnSrc(APP, 'coverRow')
      + fnSrc(APP, 'renderCoverChecklist') + fnSrc(APP, 'paintChecklist')
      + 'renderCoverChecklist(); paintChecklist();');
    return { html: box.innerHTML, note: owner.textContent };
  }
  let ob = ownerBox('code-ada', 'code-ada');
  check('no kit yet, saved kit is the one decided for: "Ada\'s checklist"', /<h2 class="ck-title">Ada's checklist<\/h2>/.test(ob.html), (ob.html.match(/<h2[^>]*>[^<]*<\/h2>/) || [])[0]);
  check('and "Only Ada can tick items."', /<p class="ck-intro">Only Ada can tick items\.<\/p>/.test(ob.html));
  check('and the popup note names Ada', ob.note === CS.ownerNote('Ada'), ob.note);
  ob = ownerBox('code-other', 'code-ada');
  check('a saved kit for another code lends no name: "Their checklist"', /<h2 class="ck-title">Their checklist<\/h2>/.test(ob.html) && /Only they can tick items\./.test(ob.html), (ob.html.match(/<h2[^>]*>[^<]*<\/h2>/) || [])[0]);
  check('and the popup note is nameless', ob.note === CS.ownerNote(''), ob.note);

  // a link in flight: no mode is decided for the saved kit until it settles
  {
    const sb = sandbox({
      flat: keys.slice(), chkMode: 'hire', chkState: {}, chkSaver: null,
      reqs: [], modes: [],
      checklistApi(body) { sb.reqs.push(body); return new Promise(() => {}); },
      checklistToLocal() { sb.modes.push('local'); sb.chkMode = 'local'; sb.chkCode = null; },
      setChecklistMode(m) { sb.modes.push(m); sb.chkMode = m; },
      makeChecklistSaver() { return { now() {}, stop() {} }; },
    });
    const listeners = {};
    sb.window = { addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); } };
    const fire = (t) => (listeners[t] || []).forEach((f) => f());
    const lines = APP.match(/^ {2}window\.addEventListener\('carrara:kit-(updated|settled)', syncChecklist\);$/mg) || [];
    run(sb, 'var chkCode = "code-karishma", chkReading = false, chkReadAgain = false;'
      + fnSrc(APP, 'currentChecklistCode') + fnSrc(APP, 'syncChecklist') + lines.join('\n'));
    run(sb, 'store("carrara_welcome", { code: "code-karishma", data: { firstName: "Karishma" } })');
    sb.window.CarraraKitPending = true;
    run(sb, 'syncChecklist()');
    check('link in flight: boot asks /api/checklist nothing', sb.reqs.length === 0, sb.reqs);
    check('and leaves the mode as it was', sb.chkMode === 'hire' && sb.modes.length === 0, sb.modes);
    run(sb, 'store("carrara_welcome", { code: "code-romina", data: { firstName: "Romina" } })');
    fire('carrara:kit-updated');
    check('the kit landing while the flag is up asks nothing yet', sb.reqs.length === 0, sb.reqs);
    sb.window.CarraraKitPending = false;
    fire('carrara:kit-settled');
    check('once settled, exactly one request, for the code saved now', same(sb.reqs, [{ code: 'code-romina' }]), sb.reqs);
  }
  {
    const sb = sandbox({
      flat: keys.slice(), chkMode: 'local', chkState: {}, chkSaver: null, reqs: [],
      checklistApi(body) { sb.reqs.push(body); return new Promise(() => {}); },
      checklistToLocal() {}, setChecklistMode() {},
    });
    sb.window = { addEventListener() {} };
    run(sb, 'var chkCode = null, chkReading = false, chkReadAgain = false;'
      + fnSrc(APP, 'currentChecklistCode') + fnSrc(APP, 'syncChecklist')
      + 'store("carrara_welcome", { code: "code-karishma", data: {} }); syncChecklist();');
    check('no link in flight: boot asks once for the saved code, as before', same(sb.reqs, [{ code: 'code-karishma' }]), sb.reqs);
  }

  // ------------------------------------------------------------ payload
  console.log('\n[payload] what a save sends');
  const p = CS.savePayload({ 'k:quarry': true, 'k:slack': true, 'k:i9': false, 'k:gone': true, 'g0i0': true }, items);
  check('done lists ticked items only, ids without k:', same(p.done.map((d) => d.id), ['slack', 'quarry']), p.done);
  check('labels are the item titles', p.done[0].label === items.find((i) => i.id === 'slack').t, p.done[0]);
  check('total is the number of checklist items', p.total === items.length, p.total);
  check('nothing else in the payload', same(Object.keys(p), ['done', 'total']) && p.done.every((d) => same(Object.keys(d), ['id', 'label'])));
  check('an empty state saves an empty list', same(CS.savePayload({}, items), { done: [], total: items.length }));

  console.log('\n[outcome] how the page reads a save\'s answer');
  check('200 role hire is saved', CS.saveOutcome(200, { role: 'hire', done: {} }) === 'saved');
  check('403 refused is refused', CS.saveOutcome(403, { refused: true }) === 'refused');
  check('200 role unknown is failed', CS.saveOutcome(200, { role: 'unknown' }) === 'failed');
  check('200 role viewer is failed', CS.saveOutcome(200, { role: 'viewer', done: {} }) === 'failed');
  check('a 401 (signed out) is failed, not refused', CS.saveOutcome(401, { error: 'Sign in required' }) === 'failed');
  check('no answer is failed', CS.saveOutcome(0, null) === 'failed');

  // ------------------------------------------------------------ saver
  console.log('\n[saver] debounce, one in flight, latest wins');
  {
    let now = 0;
    let timers = [];
    const setTimer = (fn, ms) => { const t = { fn, at: now + ms }; timers.push(t); return t; };
    const clearTimer = (t) => { timers = timers.filter((x) => x !== t); };
    const advance = async (ms) => {
      now += ms;
      for (;;) {
        const due = timers.filter((t) => t.at <= now);
        if (!due.length) break;
        timers = timers.filter((t) => t.at > now);
        due.forEach((t) => t.fn());
      }
      for (let i = 0; i < 5; i++) await Promise.resolve();
    };
    let state = 0;
    const sent = [];
    let release = [];
    const done = [];
    const saver = CS.createSaver({
      delay: CS.DEBOUNCE_MS,
      setTimer, clearTimer,
      send: () => { sent.push(state); return new Promise((r) => release.push(r)); },
      onDone: (o, busy) => done.push([o, busy])
    });
    check('the debounce is about 800 ms', CS.DEBOUNCE_MS === 800);
    state = 1; saver.queue();
    await advance(500);
    state = 2; saver.queue();
    await advance(500);
    check('ticks within 800 ms send nothing yet', sent.length === 0, sent);
    await advance(300);
    check('one save 800 ms after the last tick, with the latest state', same(sent, [2]), sent);
    state = 3; saver.queue();
    await advance(800);
    check('one save in flight at a time', sent.length === 1, sent);
    state = 4; saver.queue();
    await advance(800);
    check('still one in flight', sent.length === 1, sent);
    check('busy while a save is waiting', saver.busy() === true);
    release.shift()('saved');
    await advance(0);
    check('when it lands, one more save with the latest state', same(sent, [2, 4]), sent);
    check('the first result reports more to come', same(done[0], ['saved', true]), done);
    release.shift()('saved');
    await advance(0);
    check('the last result reports nothing left', same(done[1], ['saved', false]), done);
    check('idle afterwards', saver.busy() === false);

    state = 5; saver.queue(); await advance(800);
    release.shift()('failed'); await advance(0);
    check('a failed save is reported, not retried on its own', same(done[2], ['failed', false]) && sent.length === 3, { done, sent });

    saver.now();
    await advance(0);
    check('now() saves at once', sent.length === 4 && sent[3] === 5, sent);
    release.shift()('refused'); await advance(0);
    state = 6; saver.queue(); await advance(5000);
    check('after a refusal it never saves again', sent.length === 4, sent);
    check('a stopped saver is not busy', saver.busy() === false);

    const s2 = CS.createSaver({ delay: 800, setTimer, clearTimer, send: () => { sent.push('s2'); return Promise.resolve('saved'); } });
    s2.queue(); s2.stop(); await advance(5000);
    check('stop() drops a waiting save', sent.indexOf('s2') === -1, sent);
  }

  // ------------------------------------------------------------ handler
  console.log('\n[handler] /api/checklist');
  const KEY = 'plan-key-test-0001';
  const CODE = code(KEY);
  const HIRE = 'ada.test@example.com';
  const OTHER = 'mallory.test@example.com';
  check('the test code decodes with the plan key', (welcome.decode(CODE) || {}).planKey === KEY);

  // read, hire
  calls = [];
  answer = () => ({ status: 200, body: { role: 'hire', done: { slack: '2026-11-10T10:00:00Z' }, total: 17, updated_at: '2026-11-10T10:00:00Z', email: HIRE, name: 'Ada', secret: 'x' } });
  let r = await call({ code: CODE }, session(HIRE));
  check('a read reaches POps once', calls.length === 1, calls.length);
  check('POST to the default base and the plan key', calls[0].url === 'https://carrara-pops.work/api/hub-progress/' + KEY && calls[0].init.method === 'POST', calls[0].url);
  check('with the POPS_PLAN_TOKEN bearer and JSON', calls[0].init.headers.Authorization === 'Bearer ' + TOKEN && /json/.test(calls[0].init.headers['Content-Type']));
  check('with a timeout signal', !!calls[0].init.signal && typeof calls[0].init.signal.aborted === 'boolean');
  check('a read sends viewer_email only', same(calls[0].body, { viewer_email: HIRE }), calls[0].body);
  check('200 with the hire\'s progress', r.statusCode === 200 && r.body.role === 'hire' && same(r.body.done, { slack: '2026-11-10T10:00:00Z' }));
  check('only role, done, total, updated_at reach the browser', same(Object.keys(r.body).sort(), ['done', 'role', 'total', 'updated_at']), r.body);
  check('Cache-Control: no-store', r.headers['cache-control'] === 'no-store');

  // allowlist inside done
  answer = () => ({ status: 200, body: { role: 'viewer', done: { slack: '2026-11-10T10:00:00Z', 'Bad Id': 'x', quarry: { nested: 1 }, __proto__x: 'y' }, total: 17, updated_at: null } });
  r = await call({ code: CODE }, session(OTHER));
  check('viewer passes through as viewer', r.body.role === 'viewer');
  check('done keeps only valid ids with string times', same(r.body.done, { slack: '2026-11-10T10:00:00Z' }), r.body.done);
  check('updated_at null stays null', r.body.updated_at === null);

  // the email comes from the session, never the body
  calls = [];
  answer = () => ({ status: 200, body: { role: 'viewer', done: {}, total: 17, updated_at: null } });
  await call({ code: CODE, viewer_email: HIRE, email: HIRE, save: undefined }, session(OTHER));
  check('a body that names another email is ignored: the session\'s email is sent', calls.length === 1 && calls[0].body.viewer_email === OTHER, calls[0] && calls[0].body);
  calls = [];
  r = await call({ code: CODE, viewer_email: HIRE }, null);
  check('no session: POps is never called, even with an email in the body', calls.length === 0 && same(r.body, { role: 'unknown' }) && r.statusCode === 200, r.body);

  // save
  calls = [];
  answer = () => ({ status: 200, body: { role: 'hire', done: { slack: '2026-11-12T10:00:00Z' }, total: 17, updated_at: '2026-11-12T10:00:00Z' } });
  const save = { done: [{ id: 'slack', label: 'Set up your Slack workspace', extra: 1 }], total: 17, extra: 'x' };
  r = await call({ code: CODE, save }, session(HIRE));
  check('a save sends viewer_email and save', calls.length === 1 && same(Object.keys(calls[0].body), ['viewer_email', 'save']), calls[0] && calls[0].body);
  check('the save carries only done [{ id, label }] and total', same(calls[0].body.save, { done: [{ id: 'slack', label: 'Set up your Slack workspace' }], total: 17 }), calls[0].body.save);
  check('a saved answer comes back allowlisted', r.statusCode === 200 && r.body.role === 'hire');

  answer = () => ({ status: 403, body: { error: 'viewer cannot save' } });
  r = await call({ code: CODE, save: { done: [], total: 17 } }, session(OTHER));
  check('POps 403 on a save: 403 { refused: true }', r.statusCode === 403 && same(r.body, { refused: true }), { s: r.statusCode, b: r.body });
  answer = () => ({ status: 400, body: { error: 'bad body' } });
  r = await call({ code: CODE, save: { done: [], total: 17 } }, session(HIRE));
  check('POps 400 on a save: 403 { refused: true }', r.statusCode === 403 && same(r.body, { refused: true }), { s: r.statusCode, b: r.body });
  check('a refusal has no-store too', r.headers['cache-control'] === 'no-store');
  answer = () => ({ status: 500, body: {} });
  r = await call({ code: CODE, save: { done: [], total: 17 } }, session(HIRE));
  check('POps 500 on a save: unknown, so the page keeps it as not saved yet', r.statusCode === 200 && same(r.body, { role: 'unknown' }), r.body);

  calls = [];
  const badSaves = [
    { done: 'slack', total: 17 },
    { done: [{ id: 'Slack', label: 'x' }], total: 17 },
    { done: [{ id: 'slack', label: '' }], total: 17 },
    { done: [{ id: 'slack', label: 'x'.repeat(161) }], total: 17 },
    { done: [{ id: 'slack', label: 'x' }], total: 201 },
    { done: [{ id: 'slack', label: 'x' }], total: 1.5 },
    { done: Array.from({ length: 101 }, (_, i) => ({ id: 'i' + i, label: 'x' })), total: 17 },
    { done: [{ id: 'slack', label: 'x' }, { id: 'slack', label: 'x' }], total: 17 },
    [],
    'save'
  ];
  let allRefused = true;
  for (const s of badSaves) {
    const rr = await call({ code: CODE, save: s }, session(HIRE));
    if (!(rr.statusCode === 403 && same(rr.body, { refused: true }))) allRefused = false;
  }
  check('a save outside the contract is refused here, before POps', allRefused && calls.length === 0, calls.length);

  // every non-answer is { role: "unknown" }
  console.log('\n[handler] every non-answer is { role: "unknown" }');
  const unknownCase = async (label, body, cookie, setup) => {
    calls = [];
    const restore = setup ? setup() : null;
    let res;
    try { res = await call(body, cookie); } finally { if (restore) restore(); }
    check(label, res.statusCode === 200 && same(res.body, { role: 'unknown' }) && res.headers['cache-control'] === 'no-store', { s: res.statusCode, b: res.body });
    return res;
  };
  answer = () => ({ status: 200, body: { role: 'hire', done: {}, total: 17, updated_at: null } });
  await unknownCase('no code', {}, session(HIRE));
  await unknownCase('a bad code', { code: 'abc.0123456789' }, session(HIRE));
  await unknownCase('a code that is not a string', { code: { x: 1 } }, session(HIRE));
  await unknownCase('a code with no plan key', { code: code('') }, session(HIRE));
  await unknownCase('a body that is not an object', 'code=' + CODE, session(HIRE));
  await unknownCase('a body that is an array', [CODE], session(HIRE));
  await unknownCase('no body', undefined, session(HIRE));
  await unknownCase('no session', { code: CODE }, null);
  await unknownCase('a session signed with another secret', { code: CODE }, session(HIRE, { secret: 'not-the-secret' }));
  const t = Math.floor(Date.now() / 1000);
  await unknownCase('an idle session', { code: CODE }, session(HIRE, { seen: t - 3601 }));
  await unknownCase('an expired session', { code: CODE }, session(HIRE, { exp: t - 1 }));
  await unknownCase('no POPS_PLAN_TOKEN', { code: CODE }, session(HIRE), () => { delete process.env.POPS_PLAN_TOKEN; return () => { process.env.POPS_PLAN_TOKEN = TOKEN; }; });
  check('no POPS_PLAN_TOKEN: POps is never called', calls.length === 0);
  await unknownCase('GOOGLE_CLIENT_ID unset (site open, no sessions)', { code: CODE }, session(HIRE), () => { delete process.env.GOOGLE_CLIENT_ID; return () => { process.env.GOOGLE_CLIENT_ID = 'verify-checklist-client-id'; }; });
  for (const st of [401, 404, 500, 302]) {
    answer = () => ({ status: st, body: { role: 'hire', done: {}, total: 17 } });
    await unknownCase('POps ' + st + ' on a read', { code: CODE }, session(HIRE));
  }
  answer = () => ({ status: 403, body: {} });
  await unknownCase('POps 403 on a read', { code: CODE }, session(HIRE));
  answer = () => ({ status: 200, raw: 'not json' });
  await unknownCase('POps answers something that is not JSON', { code: CODE }, session(HIRE));
  for (const b of [null, [], 'hire', 7]) {
    answer = () => ({ status: 200, body: b });
    await unknownCase('POps answers ' + JSON.stringify(b), { code: CODE }, session(HIRE));
  }
  answer = () => ({ status: 200, body: { role: 'admin', done: {} } });
  await unknownCase('POps answers a role it does not have', { code: CODE }, session(HIRE));
  answer = () => ({ status: 200, body: { role: 'unknown', done: { slack: 'x' }, total: 17 } });
  await unknownCase('role unknown carries nothing else', { code: CODE }, session(HIRE));
  answer = () => new TypeError('fetch failed');
  await unknownCase('POps unreachable', { code: CODE }, session(HIRE));

  // a POps that answers the socket and then says nothing: aborted at 2500 ms
  answer = (c) => new Promise((resolve) => {
    c.init.signal.addEventListener('abort', () => resolve(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  // AbortSignal.timeout's timer does not hold the event loop open; this one does.
  const hold = setTimeout(() => {}, 10000);
  const t0 = Date.now();
  await unknownCase('a POps that hangs is cut off', { code: CODE }, session(HIRE));
  clearTimeout(hold);
  const took = Date.now() - t0;
  check('and cut off at about 2500 ms', took >= 2400 && took < 4000, took);

  check('GET is refused with 405', (await call({ code: CODE }, session(HIRE), { method: 'GET' })).statusCode === 405);

  process.env.POPS_PROGRESS_URL = 'https://pops.example.test/api/hub-progress/';
  calls = [];
  answer = () => ({ status: 200, body: { role: 'unknown' } });
  await call({ code: CODE }, session(HIRE));
  check('POPS_PROGRESS_URL overrides the base, read at call time', calls[0] && calls[0].url === 'https://pops.example.test/api/hub-progress/' + KEY, calls[0] && calls[0].url);
  delete process.env.POPS_PROGRESS_URL;

  // nothing secret in logs or responses
  console.log('\n[secrets] nothing the handler logs or returns carries an email, a code or the token');
  const everything = logged.join('\n') + '\n' + returned.join('\n');
  check('the handler logged nothing', logged.length === 0, logged.slice(0, 3));
  check('no email in any response', !/@example\.com/.test(returned.join('\n')));
  check('no code in any response', returned.join('\n').indexOf(CODE) === -1 && returned.join('\n').indexOf(CODE.split('.')[0]) === -1);
  check('no token in any response or log', everything.indexOf(TOKEN) === -1);
  check('no plan key in any response', returned.join('\n').indexOf(KEY) === -1);

  console.log('');
  finished = true;
  if (failures) {
    console.error(failures + ' of ' + count + ' check(s) FAILED');
    process.exit(1);
  }
  console.log(count + ' checks, checklist OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
