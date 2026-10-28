// Verifies who middleware.js lets into the hub, without a server and without a
// test runner (this repo has no package.json on purpose).
//
//   node scripts/verify-session.js
//
// It loads middleware.js as it ships (a copy with an .mjs name, since it is
// ESM and this repo has no package.json to say so), calls it with real Request
// objects and checks:
//   1. sessions:  a fresh Google session gets in; one idle for over an hour,
//                 one older than 24 hours, a tampered one, and an old 30 day
//                 cookie with no "last use" time do not
//   2. codes:     an access code on its own gets nowhere: ?code= goes to
//                 Google with the code kept in next=, and a hub_kit cookie
//                 is ignored, even when the code is one POps really minted
//   3. refresh:   a page load after five quiet minutes gets one redirect to
//                 the same URL with a fresh cookie; API calls and posts only
//                 check, never redirect
//   4. outside:   the /api 401, the cron bearer, the matcher, and an unset
//                 GOOGLE_CLIENT_ID leaving the site open
// Session cookies come from api/_lib/signin.js's startSession where they can,
// and are signed by hand the same way where a test needs to set the times.
// Exits non-zero when any check fails.
//
// scripts/verify-mint.js owns the access code format. This file only checks
// that a code no longer opens the hub by itself.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

// A verifier that STOPS EARLY must never look like a verifier that passed.
// Node exits with status 0 the moment the event loop empties, and an await
// that never settles empties it, so a truncated run would otherwise be
// silent green. Completion is asserted here, not assumed. (Ported from
// scripts/verify-my-onboarding.js, which owns the original of this guard.)
let finished = false;
process.on('exit', (code) => {
  if (!finished && code === 0) {
    console.error('\nFAILED: the verifier exited before finishing: something awaited never settled');
    process.exitCode = 1;
  }
});

// Fixed test values, never inherited from the shell, set before anything loads.
const SECRET = 'verify-session-auth-secret';
process.env.GOOGLE_CLIENT_ID = 'verify-session-client-id';
process.env.AUTH_SECRET = SECRET;
delete process.env.GOOGLE_CLIENT_SECRET;
delete process.env.CRON_SECRET;
process.env.WELCOME_SECRET = 'verify-session-welcome-secret';
process.env.POPS_HUB_TOKEN = 'verify-session-pops-token';
delete process.env.POPS_PLAN_TOKEN;

const { startSession } = require('../api/_lib/signin.js');
const mint = require('../api/mint.js');

const ORIGIN = 'https://onboarding.example.com';
const MIN = 60;
const HOUR = 60 * MIN;

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log('  ok   ' + label);
  else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-session-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

// Each load is a fresh copy under a new name, so the import is never cached.
let loads = 0;
async function loadMiddleware() {
  const file = path.join(tmp, 'middleware-' + ++loads + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', 'middleware.js'), file);
  return import(pathToFileURL(file).href);
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

// Signed the way api/_lib/signin.js signs: HMAC-SHA256 over the base64url body.
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
}

function payloadOf(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split('.')[0], 'base64url').toString());
  } catch {
    return null;
  }
}

function fakeRes() {
  const res = { statusCode: 0, body: null, headers: {}, location: null };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.redirect = (status, url) => { res.statusCode = status; res.location = url; return res; };
  return res;
}

// A session cookie made the real way: api/_lib/signin.js's startSession.
function realSession() {
  const res = fakeRes();
  startSession(res, { email: 'ada@carrara.is', name: 'Ada Lovelace' }, '/');
  const cookies = [].concat(res.headers['set-cookie'] || []);
  const line = cookies.find((c) => c.startsWith('hub_session=')) || '';
  return { line, token: line.slice('hub_session='.length).split(';')[0], res };
}

// The session cookie a response sets, if any.
function setSession(response) {
  const line = (response && response.headers.get('set-cookie')) || '';
  return { line, token: line.startsWith('hub_session=') ? line.slice('hub_session='.length).split(';')[0] : null };
}

function req(pathname, { method = 'GET', cookie, headers = {} } = {}) {
  const h = Object.assign({}, headers);
  if (cookie) h.cookie = cookie;
  return new Request(ORIGIN + pathname, { method, headers: h });
}

// Where a redirect to sign in points, and the next= it carries.
function loginTarget(response) {
  if (!response || response.status !== 302) return null;
  const to = new URL(response.headers.get('location'), ORIGIN);
  return to.pathname === '/api/auth/login' ? { next: to.searchParams.get('next') } : null;
}

const describe = (r) => (r === undefined ? 'passed' : { status: r.status, location: r.headers.get('location'), setCookie: r.headers.get('set-cookie') });

async function main() {
  const mw = await loadMiddleware();
  const run = (r) => mw.default(r);

  // ------------------------------------------------------------- sessions
  console.log('\n[sessions] a Carrara Google session gets in, an expired one does not');

  const fresh = realSession();
  const freshPayload = payloadOf(fresh.token) || {};
  const t0 = nowSeconds();
  check('startSession sets a hub_session cookie', !!fresh.token, fresh.res.headers);
  check('startSession payload is { email, name, iat, seen, exp }',
    JSON.stringify(Object.keys(freshPayload)) === JSON.stringify(['email', 'name', 'iat', 'seen', 'exp']), freshPayload);
  check('startSession: iat and seen are now', Math.abs(freshPayload.iat - t0) <= 2 && freshPayload.seen === freshPayload.iat, freshPayload);
  check('startSession: exp is iat + 24h', freshPayload.exp === freshPayload.iat + 24 * HOUR, freshPayload);
  check('startSession: cookie lasts 24h with Path=/; HttpOnly; Secure; SameSite=Lax',
    fresh.line.includes('; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400'), fresh.line);

  const a = await run(req('/', { cookie: 'hub_session=' + fresh.token }));
  check('(a) a fresh session on GET / passes', a === undefined, describe(a));

  let t = nowSeconds();
  const idle = sign({ email: 'ada@carrara.is', name: 'Ada', iat: t - 61 * MIN, seen: t - 61 * MIN, exp: t - 61 * MIN + 24 * HOUR });
  const b = await run(req('/team', { cookie: 'hub_session=' + idle }));
  check('(b) seen 61 minutes ago is refused (302 to /api/auth/login)', !!loginTarget(b), describe(b));

  t = nowSeconds();
  const old = sign({ email: 'ada@carrara.is', name: 'Ada', iat: t - 25 * HOUR, seen: t, exp: t - 25 * HOUR + 24 * HOUR });
  const c = await run(req('/', { cookie: 'hub_session=' + old }));
  check('(c) iat 25 hours ago with seen just now is refused', !!loginTarget(c), describe(c));

  const [body, sig] = fresh.token.split('.');
  const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
  const d = await run(req('/', { cookie: 'hub_session=' + body + '.' + flipped }));
  check('(d) a tampered signature is refused', !!loginTarget(d), describe(d));
  const forged = Buffer.from(JSON.stringify(Object.assign({}, freshPayload, { email: 'mallory@carrara.is' }))).toString('base64url');
  const d2 = await run(req('/', { cookie: 'hub_session=' + forged + '.' + sig }));
  check('(d) a changed payload under the old signature is refused', !!loginTarget(d2), describe(d2));

  // The cookie every signed-in browser holds today: { email, name, exp } for 30
  // days, no iat, no seen. It must send its holder back to Google.
  t = nowSeconds();
  const legacy = sign({ email: 'ada@carrara.is', name: 'Ada', exp: t + 30 * 24 * HOUR });
  const m = await run(req('/', { cookie: 'hub_session=' + legacy }));
  check('(extra) an old 30 day cookie with no seen is refused', !!loginTarget(m), describe(m));

  // readSession's rules at their edges, with the clock passed in.
  t = nowSeconds();
  const edge = sign({ email: 'ada@carrara.is', name: 'Ada', iat: t - 2 * HOUR, seen: t - HOUR, exp: t - 2 * HOUR + 24 * HOUR });
  check('(extra) readSession: seen exactly 60 minutes ago still passes', !!(await mw.readSession(edge, SECRET, t)));
  check('(extra) readSession: seen 60 minutes and 1 second ago is refused', (await mw.readSession(edge, SECRET, t + 1)) === null);
  const atExp = sign({ email: 'ada@carrara.is', name: 'Ada', iat: t - 24 * HOUR, seen: t, exp: t });
  check('(extra) readSession: refused at the exact second of exp', (await mw.readSession(atExp, SECRET, t)) === null);
  check('(extra) readSession: wrong secret is refused', (await mw.readSession(fresh.token, 'not-the-secret')) === null);

  // ------------------------------------------------------------- codes
  console.log('\n[codes] an access code on its own does not get in');

  const e = await run(req('/?code=abc.0123456789'));
  const eTarget = loginTarget(e);
  check('(e) GET /?code=abc.0123456789 with no session redirects to login', !!eTarget, describe(e));
  check('(e) next= carries /?code=abc.0123456789', eTarget && eTarget.next === '/?code=abc.0123456789', eTarget);

  const f = await run(req('/', { cookie: 'hub_kit=anything' }));
  check('(f) a request with only a hub_kit cookie is refused', !!loginTarget(f), describe(f));

  // The same two, with a code POps really minted (api/mint.js, valid signature).
  const minted = fakeRes();
  await mint({ method: 'POST', headers: { host: 'onboarding.example.com', authorization: 'Bearer ' + process.env.POPS_HUB_TOKEN }, body: { name: 'Ada Lovelace', manager: 'Sol Silbenberg' } }, minted);
  const code = (minted.body && minted.body.code) || '';
  check('(extra) api/mint.js minted a real code to test with', minted.statusCode === 200 && code.includes('.'), minted.body);
  const e2 = await run(req('/?code=' + encodeURIComponent(code)));
  const e2Target = loginTarget(e2);
  check('(extra) a really minted ?code= with no session goes to login, not in', !!e2Target, describe(e2));
  check('(extra) and next= carries that code back', e2Target && e2Target.next === '/?code=' + code, e2Target);
  check('(extra) no hub_kit cookie is set', !(e2 && (e2.headers.get('set-cookie') || '').includes('hub_kit')), describe(e2));
  const f2 = await run(req('/', { cookie: 'hub_kit=' + encodeURIComponent(code) }));
  check('(extra) a hub_kit cookie holding a really minted code is refused', !!loginTarget(f2), describe(f2));
  const f3 = await run(req('/?code=' + encodeURIComponent(code) + '&hub_kit=1'));
  check('(extra) the old ?hub_kit=1 marker does not get in', !!loginTarget(f3), describe(f3));
  const f4 = await run(req('/api/team', { cookie: 'hub_kit=' + encodeURIComponent(code) }));
  check('(extra) /api/team with only a hub_kit cookie is a 401', f4 && f4.status === 401, describe(f4));

  // ------------------------------------------------------------- refresh
  console.log('\n[refresh] page loads move "last use" forward, API calls only check');

  t = nowSeconds();
  const iat = t - 30 * MIN;
  const exp = iat + 24 * HOUR;
  const quiet = sign({ email: 'ada@carrara.is', name: 'Renée Lovelace', iat, seen: t - 6 * MIN, exp });

  const g = await run(req('/team', { cookie: 'hub_session=' + quiet }));
  const gCookie = setSession(g);
  const gPayload = payloadOf(gCookie.token) || {};
  t = nowSeconds();
  check('(g) GET /team with seen 6 minutes ago gets a 302 to the same URL',
    !!g && g.status === 302 && g.headers.get('location') === ORIGIN + '/team', describe(g));
  check('(g) the new cookie has seen within 2 seconds of now', Math.abs(gPayload.seen - t) <= 2, gPayload);
  check('(g) and the same iat and exp', gPayload.iat === iat && gPayload.exp === exp, { got: gPayload, iat, exp });
  check('(g) and the same email and name, non-ASCII included', gPayload.email === 'ada@carrara.is' && gPayload.name === 'Renée Lovelace', gPayload);
  check('(g) the cookie keeps Path=/; HttpOnly; Secure; SameSite=Lax',
    gCookie.line.includes('; Path=/; HttpOnly; Secure; SameSite=Lax;'), gCookie.line);
  const maxAge = Number((/Max-Age=(\d+)/.exec(gCookie.line) || [])[1]);
  check('(g) Max-Age is the seconds left until exp', Math.abs(maxAge - (exp - t)) <= 2, { maxAge, left: exp - t });
  check('(g) the new cookie is signed the way signin.js signs', gCookie.token === sign(gPayload), gCookie.token);
  const gAgain = await run(req('/team', { cookie: 'hub_session=' + gCookie.token }));
  check('(g) following the redirect with the new cookie passes, no loop', gAgain === undefined, describe(gAgain));
  const gQuery = await run(req('/team?x=1', { cookie: 'hub_session=' + quiet }));
  check('(extra) the refresh redirect keeps the query', !!gQuery && gQuery.headers.get('location') === ORIGIN + '/team?x=1', describe(gQuery));

  t = nowSeconds();
  const recent = sign({ email: 'ada@carrara.is', name: 'Ada', iat: t - 30 * MIN, seen: t - 4 * MIN, exp: t - 30 * MIN + 24 * HOUR });
  const g2 = await run(req('/team', { cookie: 'hub_session=' + recent }));
  check('(extra) GET /team with seen 4 minutes ago passes with no redirect', g2 === undefined, describe(g2));

  const h = await run(req('/api/team', { cookie: 'hub_session=' + quiet }));
  check('(h) GET /api/team with seen 6 minutes ago gets a 302 to the same URL (a data fetch counts as use)',
    !!h && h.status === 302 && h.headers.get('location') === ORIGIN + '/api/team', describe(h));
  const hCookie = h && h.headers.get('set-cookie') || '';
  check('(h) and a fresh hub_session cookie', /^hub_session=/.test(hCookie) && /HttpOnly/.test(hCookie), hCookie);
  const h2 = await run(req('/api/team', { cookie: 'hub_session=' + recent }));
  check('(h) GET /api/team with seen 4 minutes ago passes with no redirect', h2 === undefined, describe(h2));

  const i = await run(req('/api/profile', { method: 'POST', cookie: 'hub_session=' + quiet }));
  check('(i) POST /api/profile with seen 6 minutes ago passes with no redirect', i === undefined, describe(i));
  const i2 = await run(req('/', { method: 'POST', cookie: 'hub_session=' + quiet }));
  check('(extra) POST / with seen 6 minutes ago passes with no redirect', i2 === undefined, describe(i2));

  // ------------------------------------------------------------- outside
  console.log('\n[outside] the 401, the cron, the matcher, and the switch');

  const j = await run(req('/api/team'));
  let jBody = null;
  try { jBody = j && (await j.json()); } catch { jBody = null; }
  check('(j) GET /api/team with no session is a 401', !!j && j.status === 401, describe(j));
  check('(j) with JSON { error: "Sign in required" }',
    !!j && (j.headers.get('content-type') || '').includes('application/json') && jBody && jBody.error === 'Sign in required', jBody);

  process.env.CRON_SECRET = 'verify-session-cron';
  const cron = await run(req('/api/team', { headers: { authorization: 'Bearer verify-session-cron' } }));
  check('(extra) the cron bearer still gets /api/team', cron === undefined, describe(cron));
  const notCron = await run(req('/api/team', { headers: { authorization: 'Bearer wrong' } }));
  check('(extra) a wrong bearer is a 401', !!notCron && notCron.status === 401, describe(notCron));
  delete process.env.CRON_SECRET;

  // Until GOOGLE_CLIENT_ID is set the site stays open: a fresh import with it unset.
  delete process.env.GOOGLE_CLIENT_ID;
  const open = await loadMiddleware();
  const k = [
    await open.default(req('/')),
    await open.default(req('/team')),
    await open.default(req('/api/team')),
    await open.default(req('/api/profile', { method: 'POST' })),
    await open.default(req('/?code=abc.0123456789')),
    await open.default(req('/', { cookie: 'hub_kit=anything' })),
    await open.default(req('/team', { cookie: 'hub_session=' + quiet })),
    await open.default(req('/', { cookie: 'hub_session=' + idle }))
  ];
  check('(k) with GOOGLE_CLIENT_ID unset every request passes', k.every((r) => r === undefined), k.map(describe));
  process.env.GOOGLE_CLIENT_ID = 'verify-session-client-id';

  const pattern = (mw.config && mw.config.matcher && mw.config.matcher[0]) || '';
  const matcher = new RegExp('^' + pattern + '$');
  for (const p of ['/api/mint', '/api/auth/login', '/api/slack-newhire', '/assets/x.svg']) {
    check('(l) the matcher leaves out ' + p, !matcher.test(p), pattern);
  }
  for (const p of ['/', '/team.json', '/api/team']) {
    check('(l) the matcher covers ' + p, matcher.test(p), pattern);
  }

  console.log('');
  finished = true;
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('sessions OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
