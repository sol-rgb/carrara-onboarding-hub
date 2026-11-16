// Verifies that a Vercel preview signs in through production, without a
// server, without Google and without a test runner.
//
//   node scripts/verify-preview-signin.js
//
// Google only returns to redirect URIs listed on the client, so a preview
// sends Google back to production, and production hands the result back to
// the preview in a short lived signed token (api/_lib/signin.js has the
// whole story). This walks that round trip with api/auth/login.js and
// api/auth/google.js as they ship, Google's token endpoint faked, and checks:
//   1. production: login and callback work exactly as before
//   2. preview:    login sends Google to production with a signed state, and
//                  the round trip ends in a session cookie on the preview
//   3. refusals:   a forged or foreign state, a non Carrara account, a token
//                  for another host, another browser, out of date or tampered,
//                  and a handoff token used as a session cookie
// Exits non-zero when any check fails.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

let finished = false;
process.on('exit', (code) => {
  if (!finished && code === 0) {
    console.error('\nFAILED: the verifier exited before finishing: something awaited never settled');
    process.exitCode = 1;
  }
});

// Fixed test values, never inherited from the shell, set before anything loads.
process.env.GOOGLE_CLIENT_ID = 'verify-preview-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'verify-preview-client-secret';
delete process.env.AUTH_SECRET;
delete process.env.AUTH_ORIGIN;
delete process.env.ALLOWED_EMAILS;
delete process.env.VERCEL_ENV;

const login = require('../api/auth/login.js');
const google = require('../api/auth/google.js');
const signin = require('../api/_lib/signin.js');

const PROD = 'onboarding.carrara.is';
const PREVIEW = 'carrara-onboarding-p3im5x1zg-sol-8125s-projects.vercel.app';
const BRANCH = 'carrara-onboarding-hub-git-yan-checkl-f7d9c0-sol-8125s-projects.vercel.app';

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log('  ok   ' + label);
  else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}

// Google's token endpoint, faked: hands back an id token for whoever `googleSays` names,
// and records the redirect_uri it was sent.
let googleSays = null;
let sentRedirect = null;
global.fetch = async (url, opts) => {
  sentRedirect = new URLSearchParams(opts.body).get('redirect_uri');
  const claims = Object.assign({
    iss: 'https://accounts.google.com', aud: process.env.GOOGLE_CLIENT_ID, exp: Math.floor(Date.now() / 1000) + 3600, email_verified: true
  }, googleSays);
  const jwt = 'x.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.x';
  return { json: async () => ({ id_token: jwt }) };
};
const ADA = { email: 'ada@carrara.is', name: 'Ada Lovelace', hd: 'carrara.is' };
const GMAIL = { email: 'ada@gmail.com', name: 'Ada', hd: undefined };

function fakeRes() {
  const res = { statusCode: 200, body: null, headers: {}, location: null };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.send = (b) => { res.body = b; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.redirect = (status, url) => { res.statusCode = status; res.location = url; return res; };
  return res;
}
const cookies = (res) => [].concat(res.headers['set-cookie'] || []);
const cookieValue = (res, name) => {
  const line = cookies(res).find((c) => c.startsWith(name + '='));
  return line ? line.slice(name.length + 1).split(';')[0] : null;
};
const describe = (res) => ({ status: res.statusCode, location: res.location, cookies: cookies(res), body: res.body && String(res.body).slice(-200) });

async function call(handler, host, query, cookie) {
  const res = fakeRes();
  await handler({ headers: Object.assign({ host, 'x-forwarded-proto': 'https' }, cookie ? { cookie } : {}), query }, res);
  return res;
}

// Login on `host`, then Google's redirect parameters it produced.
async function startLogin(host, next) {
  const res = await call(login, host, { next });
  const to = new URL(res.location);
  return { res, state: to.searchParams.get('state'), redirectUri: to.searchParams.get('redirect_uri'), stateCookie: 'hub_state=' + cookieValue(res, 'hub_state') };
}

// The full preview round trip; returns every hop.
async function previewRoundTrip(host, user, next = '/team') {
  process.env.VERCEL_ENV = 'preview';
  const l = await startLogin(host, next);
  process.env.VERCEL_ENV = 'production';
  googleSays = user;
  const p = await call(google, PROD, { code: 'c', state: l.state });
  process.env.VERCEL_ENV = 'preview';
  const back = p.location ? new URL(p.location) : null;
  const h = back ? await call(google, back.host, Object.fromEntries(back.searchParams), l.stateCookie) : null;
  return { l, p, back, h };
}

async function main() {
  // ------------------------------------------------------------- production
  console.log('\n[production] sign in works as before');
  process.env.VERCEL_ENV = 'production';
  const pl = await startLogin(PROD, '/team');
  check('login: redirect_uri is this site', pl.redirectUri === 'https://' + PROD + '/api/auth/google', pl.redirectUri);
  check('login: state is a plain nonce', /^[0-9a-f]{32}$/.test(pl.state), pl.state);
  check('login: hub_state cookie holds that nonce and next', cookieValue(pl.res, 'hub_state') === pl.state + '|%2Fteam', cookies(pl.res));
  googleSays = ADA;
  const pg = await call(google, PROD, { code: 'c', state: pl.state }, pl.stateCookie);
  check('callback: code swapped with this site as redirect_uri', sentRedirect === 'https://' + PROD + '/api/auth/google', sentRedirect);
  check('callback: session cookie set and back to /team', !!cookieValue(pg, 'hub_session') && pg.location === '/team', describe(pg));
  const pg2 = await call(google, PROD, { code: 'c', state: pl.state });
  check('callback: without the state cookie it is refused', pg2.statusCode === 400 && !cookieValue(pg2, 'hub_session'), describe(pg2));
  googleSays = GMAIL;
  const pg3 = await call(google, PROD, { code: 'c', state: pl.state }, pl.stateCookie);
  check('callback: a personal Gmail is refused', pg3.statusCode === 403 && !cookieValue(pg3, 'hub_session'), describe(pg3));

  process.env.VERCEL_ENV = 'preview';
  const odd = await startLogin('something-else.vercel.app', '/');
  check('a preview on an address that is not ours signs in directly, as before', odd.redirectUri === 'https://something-else.vercel.app/api/auth/google' && !odd.state.includes(':'), odd.redirectUri);

  // ------------------------------------------------------------- preview
  console.log('\n[preview] round trip through production');
  for (const host of [PREVIEW, BRANCH]) {
    const r = await previewRoundTrip(host, ADA);
    check(host.slice(0, 40) + '...: login sends Google back to production', r.l.redirectUri === 'https://' + PROD + '/api/auth/google', r.l.redirectUri);
    check('  state is nonce:host:signature', r.l.state.split(':').length === 3 && r.l.state.split(':')[1] === host, r.l.state);
    check('  hub_state cookie on the preview holds the plain nonce', cookieValue(r.l.res, 'hub_state').split('|')[0] === r.l.state.split(':')[0], cookies(r.l.res));
    check('  production swaps the code with its own redirect_uri', sentRedirect === 'https://' + PROD + '/api/auth/google', sentRedirect);
    check('  production sets no session of its own', !cookieValue(r.p, 'hub_session'), describe(r.p));
    check('  production redirects to the preview with ?handoff=', !!r.back && r.back.host === host && r.back.pathname === '/api/auth/google' && !!r.back.searchParams.get('handoff'), describe(r.p));
    check('  production sends Referrer-Policy: no-referrer', r.p.headers['referrer-policy'] === 'no-referrer', r.p.headers);
    check('  the preview sets its session and goes to /team', !!r.h && !!cookieValue(r.h, 'hub_session') && r.h.location === '/team', r.h && describe(r.h));
    check('  and clears hub_state', !!r.h && cookies(r.h).some((c) => c.startsWith('hub_state=;')), r.h && cookies(r.h));
  }

  // The session the preview set is one middleware.js accepts.
  const ok = await previewRoundTrip(PREVIEW, ADA);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-preview-'));
  process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
  fs.copyFileSync(path.join(__dirname, '..', 'middleware.js'), path.join(tmp, 'middleware.mjs'));
  const mw = await import(pathToFileURL(path.join(tmp, 'middleware.mjs')).href);
  const session = await mw.readSession(cookieValue(ok.h, 'hub_session'), signin.secret());
  check('middleware.js accepts the preview session for ada@carrara.is', !!session && session.email === 'ada@carrara.is', session);

  // ------------------------------------------------------------- refusals
  console.log('\n[refusals]');
  process.env.VERCEL_ENV = 'preview';
  const l = await startLogin(PREVIEW, '/');
  const [nonce, , sig] = l.state.split(':');
  process.env.VERCEL_ENV = 'production';
  googleSays = ADA;

  const forgedHost = await call(google, PROD, { code: 'c', state: nonce + ':carrara-onboarding-evil-sol-8125s-projects.vercel.app:' + sig });
  check('production refuses a state whose host was swapped', forgedHost.statusCode === 400 && !forgedHost.location, describe(forgedHost));
  const foreign = signin.previewState(nonce, 'evil.example.com');
  const foreignRes = await call(google, PROD, { code: 'c', state: foreign });
  check('production refuses a signed state for a host outside the team', foreignRes.statusCode === 400 && !foreignRes.location, describe(foreignRes));
  const extra = await call(google, PROD, { code: 'c', state: l.state + ':x' });
  check('production refuses a state with extra parts', extra.statusCode === 400 && !extra.location, describe(extra));

  const gmail = await previewRoundTrip(PREVIEW, GMAIL);
  check('a personal Gmail is refused on production, no handoff', gmail.p.statusCode === 403 && !gmail.p.location && !gmail.h, describe(gmail.p));

  const good = await previewRoundTrip(PREVIEW, ADA);
  const token = good.back.searchParams.get('handoff');
  process.env.VERCEL_ENV = 'preview';

  const otherHost = await call(google, BRANCH, { handoff: token }, good.l.stateCookie);
  check('the token is refused on another host', otherHost.statusCode === 400 && !cookieValue(otherHost, 'hub_session'), describe(otherHost));
  const noCookie = await call(google, PREVIEW, { handoff: token });
  check('the token is refused without the state cookie (another browser)', noCookie.statusCode === 400 && !cookieValue(noCookie, 'hub_session'), describe(noCookie));
  const otherCookie = await call(google, PREVIEW, { handoff: token }, l.stateCookie);
  check('the token is refused with another sign in\'s state cookie', otherCookie.statusCode === 400 && !cookieValue(otherCookie, 'hub_session'), describe(otherCookie));

  const [body, tsig] = token.split('.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  const swapped = Buffer.from(JSON.stringify(Object.assign({}, payload, { email: 'mallory@carrara.is' }))).toString('base64url') + '.' + tsig;
  const tampered = await call(google, PREVIEW, { handoff: swapped }, good.l.stateCookie);
  check('a token with a changed email is refused', tampered.statusCode === 400 && !cookieValue(tampered, 'hub_session'), describe(tampered));

  const realNow = Date.now;
  Date.now = () => realNow() + 121 * 1000;
  const late = await call(google, PREVIEW, { handoff: token }, good.l.stateCookie);
  Date.now = realNow;
  check('a token older than two minutes is refused', late.statusCode === 400 && !cookieValue(late, 'hub_session'), describe(late));

  check('readHandoff refuses a token signed with a different secret', (() => {
    process.env.GOOGLE_CLIENT_SECRET = 'some-other-secret';
    const r = signin.readHandoff(token, PREVIEW, payload.nonce);
    process.env.GOOGLE_CLIENT_SECRET = 'verify-preview-client-secret';
    return r === null;
  })());

  const asSession = await mw.readSession(token, signin.secret());
  check('a handoff token is not a session cookie', asSession === null, asSession);

  const still = await call(google, PREVIEW, { handoff: token }, good.l.stateCookie);
  check('and after all that the real token still works in its own browser', !!cookieValue(still, 'hub_session'), describe(still));

  console.log('');
  finished = true;
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('preview sign in OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
