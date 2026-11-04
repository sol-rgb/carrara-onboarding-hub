// Verifies the team index sources, without a server and without a test runner
// (this repo has no package.json on purpose).
//
//   node scripts/verify-team.js
//
// It requires api/_lib/roster.js and api/team.js as plain CommonJS, stubs
// globalThis.fetch per case and checks:
//   1. mapping   -- fromRoster turns a POps roster into hub members: exact keys,
//                   avatar carried from the Slack snapshot by email then name,
//                   photo_url wins, isNew only for onboarding, defaults, sorting
//   2. guards    -- fromRoster throws on a non-array and on fewer than 10 members
//   3. pops      -- with POPS_ROSTER_TOKEN set and POps answering, /api/team
//                   serves source "pops" with the one hour cache header
//   4. fallback  -- a 401, a throw, or too few members fall through to the
//                   snapshot with popsError and a five minute cache, so one
//                   POps blip is not pinned at the edge for two weeks, and the
//                   token never appears
//   5. dormant   -- with no tokens at all the response is today's snapshot
//   6. wire      -- one call, the right URL, the bearer header, default URL,
//                   no doubled slash
// Every fixture name is invented. This script never reaches the network.
// Exits non-zero when any check fails.

// A verifier that STOPS EARLY must never look like a verifier that passed.
// (Same guard as scripts/verify-mint.js.)
let finished = false;
process.on('exit', (code) => {
  if (!finished && code === 0) {
    console.error('\nFAILED: the verifier exited before finishing -- something awaited never settled');
    process.exitCode = 1;
  }
});

const TOKEN = 'verify-team-roster-token-5e1';
const TWO_WEEKS = 's-maxage=1209600, stale-while-revalidate=604800';
const ONE_HOUR = 's-maxage=3600, stale-while-revalidate=86400';
const SHORT = 's-maxage=300, stale-while-revalidate=3600';
const KEYS = ['avatar', 'department', 'email', 'isNew', 'location', 'manager', 'name', 'nickname', 'startDate', 'status', 'title'];

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log('  ok   ' + label);
  } else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}

function fakeRes() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

function row(over) {
  return Object.assign({
    id: 'id-' + Math.random().toString(16).slice(2),
    full_name: 'Placeholder Person',
    preferred_name: null,
    work_email: null,
    title: null,
    department: null,
    manager: null,
    start_date: null,
    location: null,
    status: 'active',
    slack_user_id: null,
    photo_url: null,
    practice_tags: [],
    clients: []
  }, over);
}

// twelve invented rows: enough to clear the guard of 10
function bigRoster() {
  const first = ['Arlo', 'Bree', 'Cato', 'Dara', 'Elio', 'Fenna', 'Gus', 'Hale', 'Iris', 'Jory', 'Kit', 'Lune'];
  return {
    generated_at: '2026-11-03T21:35:00.000Z',
    count: first.length,
    members: first.map((f, i) => row({ full_name: f + ' Testwood', work_email: f.toLowerCase() + '@example.test', department: i % 2 ? 'Talent' : 'Finance' }))
  };
}

function stub(answer) {
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url: String(url), opts: opts || {} });
    return answer();
  };
  fn.calls = calls;
  return fn;
}
const okJson = (body) => () => ({ ok: true, status: 200, json: async () => body });

let team;
async function callTeam() {
  const res = fakeRes();
  await team({ method: 'GET', query: {}, headers: {} }, res);
  return res;
}

async function withEnv(env, fetchImpl, fn) {
  const realFetch = globalThis.fetch;
  const saved = {};
  for (const k of ['POPS_ROSTER_TOKEN', 'POPS_URL', 'SLACK_BOT_TOKEN']) { saved[k] = process.env[k]; delete process.env[k]; }
  Object.assign(process.env, env);
  globalThis.fetch = fetchImpl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = realFetch;
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
  }
}

async function main() {
  const roster = require('../api/_lib/roster.js');
  team = require('../api/team.js');
  const { fromRoster } = roster;

  // ----------------------------------------------------------------- mapping
  console.log('\n[mapping] fromRoster');
  const fixture = {
    generated_at: '2026-11-03T21:35:00.000Z',
    count: 4,
    members: [
      row({ full_name: '  Zora Quill ', preferred_name: ' Zee ', work_email: ' Zora.Quill@Example.test ', title: 'Talent Partner', department: 'Talent', location: 'New York', start_date: '2026-01-12', status: 'onboarding', manager: { id: 'm1', full_name: 'Milo Brandt', work_email: 'Milo.Brandt@Example.test' } }),
      row({ full_name: 'Ansel Fairweather', work_email: null, title: 'Analyst', manager: { id: 'm2', full_name: 'Petra Lowe', work_email: null } }),
      row({ full_name: 'Calla Nightingale', work_email: 'calla@example.test', photo_url: 'https://img.example.test/calla.png' }),
      row({ full_name: 'Bram Okonkwo-Hale', work_email: 'bram@example.test' }),
      row({ full_name: '   ', work_email: 'blank@example.test' }),
      row({ full_name: null })
    ]
  };
  const snap = [
    { name: 'Someone Else', email: 'zora.quill@example.test', title: 'x', avatar: 'assets/team-photos/zora.jpg' },
    { name: 'Ansel Fairweather', email: 'ansel.old@example.test', title: 'x', avatar: 'assets/team-photos/ansel.jpg' },
    { name: 'Calla Nightingale', email: 'calla@example.test', title: 'x', avatar: 'assets/team-photos/calla-old.jpg' },
    { name: 'Not Bram', email: '', title: 'x', avatar: 'assets/team-photos/nobody.jpg' }
  ];
  // the guard is 10, so pad with eight more invented rows for the mapping test
  const padded = { generated_at: fixture.generated_at, members: fixture.members.concat(bigRoster().members.slice(0, 8)) };
  let out = [];
  try { out = fromRoster(padded, snap); } catch (e) { check('fromRoster did not throw on a valid roster', false, String(e && e.message)); }
  check('rows without a full_name are skipped', out.length === 12, out.length);
  check('every member has exactly the hub keys', out.length > 0 && out.every((m) => JSON.stringify(Object.keys(m).sort()) === JSON.stringify(KEYS)), out.map((m) => Object.keys(m).sort()));
  const by = (n) => out.find((m) => m.name === n) || {};
  const zora = by('Zora Quill');
  check('name is trimmed', zora.name === 'Zora Quill', zora.name);
  check('nickname is preferred_name trimmed', zora.nickname === 'Zee', zora.nickname);
  check('email is trimmed and lowercased', zora.email === 'zora.quill@example.test', zora.email);
  check('title, department, location, startDate carried', zora.title === 'Talent Partner' && zora.department === 'Talent' && zora.location === 'New York' && zora.startDate === '2026-01-12', zora);
  check('avatar carried from the snapshot by email, regardless of case', zora.avatar === 'assets/team-photos/zora.jpg', zora.avatar);
  check('isNew true for onboarding', zora.isNew === true, zora.isNew);
  check('status passed through', zora.status === 'onboarding', zora.status);
  check('manager object with lowercased email', zora.manager && zora.manager.name === 'Milo Brandt' && zora.manager.email === 'milo.brandt@example.test' && Object.keys(zora.manager).length === 2, zora.manager);
  const ansel = by('Ansel Fairweather');
  check('avatar by exact name when the email is missing', ansel.avatar === 'assets/team-photos/ansel.jpg', ansel.avatar);
  check('missing email is empty string', ansel.email === '', ansel.email);
  check('manager with null email maps to empty email', ansel.manager && ansel.manager.name === 'Petra Lowe' && ansel.manager.email === '', ansel.manager);
  check('nickname, department, location, startDate default to empty', ansel.nickname === '' && ansel.department === '' && ansel.location === '' && ansel.startDate === '', ansel);
  check('isNew false for active', ansel.isNew === false, ansel.isNew);
  const calla = by('Calla Nightingale');
  check('photo_url wins over the snapshot avatar', calla.avatar === 'https://img.example.test/calla.png', calla.avatar);
  const bram = by('Bram Okonkwo-Hale');
  check('avatar empty when neither email nor name matches', bram.avatar === '', bram.avatar);
  check('manager null when unknown', bram.manager === null, bram.manager);
  check('title empty when null', bram.title === '', bram.title);
  const names = out.map((m) => m.name);
  check('sorted by name with localeCompare', JSON.stringify(names) === JSON.stringify(names.slice().sort((a, b) => a.localeCompare(b))), names);

  // ------------------------------------------------------------------ guards
  console.log('\n[guards] fromRoster refuses a bad or thin roster');
  let err = null;
  try { fromRoster({ members: 'nope' }, snap); } catch (e) { err = e; }
  check('members not an array throws', err && err.message === 'roster: members is not an array', err && err.message);
  err = null;
  try { fromRoster({}, snap); } catch (e) { err = e; }
  check('members missing throws', err && err.message === 'roster: members is not an array', err && err.message);
  err = null;
  try { fromRoster(fixture, snap); } catch (e) { err = e; }
  check('fewer than 10 surviving members throws', err && err.message === 'roster: only 4 members', err && err.message);
  err = null;
  try { fromRoster(bigRoster(), snap); } catch (e) { err = e; }
  check('12 members pass the guard', err === null, err && err.message);

  // ------------------------------------------------------------------ pops
  console.log('\n[pops] token set, POps answers 200');
  const big = bigRoster();
  const okStub = stub(okJson(big));
  const r3 = await withEnv({ POPS_ROSTER_TOKEN: TOKEN }, okStub, callTeam);
  const b3 = r3.body || {};
  check('status 200', r3.statusCode === 200, r3.statusCode);
  check('source is pops', b3.source === 'pops', b3.source);
  check('updated is generated_at', b3.updated === big.generated_at, b3.updated);
  check('one hour cache header', r3.headers['cache-control'] === ONE_HOUR, r3.headers);
  check('no channel key', !('channel' in b3), Object.keys(b3));
  check('no popsError key', !('popsError' in b3), Object.keys(b3));
  check('12 members served', Array.isArray(b3.members) && b3.members.length === 12, b3.members && b3.members.length);
  check('the token is not in the response', JSON.stringify(b3).indexOf(TOKEN) === -1);

  // ---------------------------------------------------------------- fallback
  console.log('\n[fallback] token set, POps answers 401');
  const r4 = await withEnv({ POPS_ROSTER_TOKEN: TOKEN }, stub(() => ({ ok: false, status: 401, json: async () => ({ error: 'unauthorized' }) })), callTeam);
  const b4 = r4.body || {};
  check('status 200', r4.statusCode === 200, r4.statusCode);
  check('source is snapshot', b4.source === 'snapshot', b4.source);
  check('popsError present', typeof b4.popsError === 'string' && b4.popsError.length > 0, b4.popsError);
  check('popsError names the status', /401/.test(b4.popsError || ''), b4.popsError);
  check('the token is not in the response', JSON.stringify(b4).indexOf(TOKEN) === -1);
  check('short cache header on the fallback', r4.headers['cache-control'] === SHORT, r4.headers);

  console.log('\n[fallback] token set, fetch throws');
  const r5 = await withEnv({ POPS_ROSTER_TOKEN: TOKEN }, stub(() => { throw new Error('connect ECONNREFUSED'); }), callTeam);
  const b5 = r5.body || {};
  check('status 200', r5.statusCode === 200, r5.statusCode);
  check('source is snapshot', b5.source === 'snapshot', b5.source);
  check('popsError present', typeof b5.popsError === 'string' && b5.popsError.length > 0, b5.popsError);
  check('the token is not in the response', JSON.stringify(b5).indexOf(TOKEN) === -1);
  check('short cache header on the fallback', r5.headers['cache-control'] === SHORT, r5.headers);

  console.log('\n[fallback] token set, POps answers 200 with 3 members');
  const thin = { generated_at: big.generated_at, count: 3, members: big.members.slice(0, 3) };
  const r6 = await withEnv({ POPS_ROSTER_TOKEN: TOKEN }, stub(okJson(thin)), callTeam);
  const b6 = r6.body || {};
  check('source is snapshot', b6.source === 'snapshot', b6.source);
  check('popsError mentions members', /members/.test(b6.popsError || ''), b6.popsError);
  check('short cache header on the fallback', r6.headers['cache-control'] === SHORT, r6.headers);
  check('the token is not in the response', JSON.stringify(b6).indexOf(TOKEN) === -1);

  // ------------------------------------------------------------------ dormant
  console.log('\n[dormant] no POPS token, no Slack token');
  const deadStub = stub(() => { throw new Error('should not be called'); });
  const r7 = await withEnv({}, deadStub, callTeam);
  const b7 = r7.body || {};
  const snapFile = require('../team.json');
  check('source is snapshot', b7.source === 'snapshot', b7.source);
  check('no popsError key', !('popsError' in b7), Object.keys(b7));
  check('two-week cache header unchanged', r7.headers['cache-control'] === TWO_WEEKS, r7.headers);
  check('body is the snapshot, byte for byte', JSON.stringify(b7) === JSON.stringify(snapFile));
  check('no network call', deadStub.calls.length === 0, deadStub.calls.length);

  // --------------------------------------------------------------------- wire
  console.log('\n[wire] what the POps call looks like');
  const c = okStub.calls;
  check('exactly one call', c.length === 1, c.length);
  const call = c[0] || { url: '', opts: {} };
  const hdrs = call.opts.headers || {};
  check('default URL used when POPS_URL is unset', call.url === 'https://carrara-pops.work/api/hub-roster', call.url);
  check('Authorization is Bearer <token>', hdrs.Authorization === 'Bearer ' + TOKEN, Object.keys(hdrs));
  check('cache no-store', call.opts.cache === 'no-store', call.opts.cache);
  check('a timeout signal is attached', !!call.opts.signal, typeof call.opts.signal);
  const slashStub = stub(okJson(bigRoster()));
  await withEnv({ POPS_ROSTER_TOKEN: TOKEN, POPS_URL: 'https://pops.example.test//' }, slashStub, callTeam);
  const sUrl = (slashStub.calls[0] || {}).url;
  check('trailing slash on POPS_URL does not double', sUrl === 'https://pops.example.test/api/hub-roster', sUrl);

  console.log('');
  finished = true;
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('team OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
