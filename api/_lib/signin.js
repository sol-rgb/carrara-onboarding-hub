// What sign in shares: the plain error page, the email rule and the signed
// session cookie that middleware.js checks. Same cookie format as the Carrara Hub.
const crypto = require('crypto');

// How long a session lasts. middleware.js is the reader and holds the same
// three numbers: they must match, so change them together.
// A session ends after this long without a request (middleware.js checks seen).
const IDLE_SECONDS = 60 * 60;
// A session ends this long after sign in, however busy. Written into exp below.
const MAX_SECONDS = 24 * 60 * 60;
// A GET refreshes seen once it is this old (middleware.js).
const REFRESH_SECONDS = 5 * 60;

// Signs the session cookie. Same order in middleware.js.
const secret = () => process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const page = (res, status, text) =>
  res
    .status(status)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .send(
      '<!doctype html><meta name="viewport" content="width=device-width"><title>Carrara Onboarding Hub</title>'
      + '<body style="font-family:-apple-system,system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;color:#2D2A2A">'
      + '<div style="max-width:360px;text-align:center"><img src="/assets/logo/carrara-iso-ember.svg" width="48" alt="Carrara">'
      + '<p style="margin-top:28px;line-height:1.5">' + text + '</p>'
      + '<a href="/api/auth/login" style="color:#EB4E19">Try again</a></div></body>'
    );

const allowedEmails = () => (process.env.ALLOWED_EMAILS || '').toLowerCase().split(',').map((e) => e.trim()).filter(Boolean);

// The state cookie set by /api/auth/login: "state|next".
function savedState(req) {
  const saved = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith('hub_state='));
  const [state, next] = (saved ? saved.slice(10) : '').split('|');
  return { state, next: decodeURIComponent(next || '/') };
}

// Only a path on this site: no "//host", no "/\host" (browsers read it as //host), no control characters.
const safePath = (p) => (typeof p === 'string' && /^\/(?![/\\])[^\\\s]*$/.test(p) ? p : '/');

function startSession(res, { email, name }, nextPath) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ email, name, iat: now, seen: now, exp: now + MAX_SECONDS })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  res.setHeader('Set-Cookie', [
    'hub_session=' + body + '.' + sig + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + MAX_SECONDS,
    'hub_state=; Path=/api/auth; Max-Age=0'
  ]);
  res.redirect(302, safePath(nextPath));
}

// ------------------------------------------------------------ previews
// Google only returns to redirect URIs listed on the client, exactly, with no
// wildcards, and every Vercel preview has a new address. So a preview never
// asks Google to come back to itself. It sends Google back to production
// (onboarding.carrara.is, already listed), which checks the Google account as
// usual and hands the result back to the preview in a short lived signed
// token. The preview turns that into its own session cookie.
//
//   1. preview /api/auth/login: state cookie on the preview as always; the
//      state sent to Google is "nonce:preview host:signature", signed with
//      secret(), so production only ever hands off to a host one of these
//      deployments vouched for.
//   2. production /api/auth/google: checks that signature and the host,
//      swaps the code with Google, applies the same Carrara rule, then
//      redirects to preview /api/auth/google?handoff=<token>.
//   3. preview /api/auth/google: the token must be signed, unexpired, for
//      this host and for the nonce in this browser's state cookie.
//
// Production and previews must share the signing secret (AUTH_SECRET, else
// GOOGLE_CLIENT_SECRET). If they differ, preview sign in fails closed.

// Where previews sign in. AUTH_ORIGIN overrides it.
const authOrigin = () => (process.env.AUTH_ORIGIN || 'https://onboarding.carrara.is').replace(/\/+$/, '');
const isPreview = () => process.env.VERCEL_ENV === 'preview';
// This project's preview addresses: per deployment and per branch, all under the Vercel team.
const PREVIEW_HOST = /^carrara-onboarding-[a-z0-9-]+-sol-8125s-projects\.vercel\.app$/;
// How long a handoff token lasts, in seconds.
const HANDOFF_SECONDS = 120;

const originOf = (req) => (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host;

// Each signature names what it is for, so a token made for one job never passes for another.
const mac = (purpose, text) => crypto.createHmac('sha256', secret()).update(purpose + '\n' + text).digest('base64url');
const sameMac = (a, b) => typeof a === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Whether this request should sign in through production, and the host to come back to.
function previewHost(req) {
  const host = String(req.headers.host || '').toLowerCase();
  return isPreview() && PREVIEW_HOST.test(host) && 'https://' + host !== authOrigin() ? host : null;
}

const previewState = (nonce, host) => nonce + ':' + host + ':' + mac('hub-state', nonce + ':' + host);

// { nonce, host } from a preview's state, or null when it is not one of ours.
function readPreviewState(state) {
  const [nonce, host, sig, extra] = String(state || '').split(':');
  if (extra !== undefined || !nonce || !host || !PREVIEW_HOST.test(host)) return null;
  return sameMac(sig, mac('hub-state', nonce + ':' + host)) ? { nonce, host } : null;
}

function handoffToken({ email, name }, host, nonce) {
  const body = Buffer.from(JSON.stringify({ email, name, host, nonce, exp: Math.floor(Date.now() / 1000) + HANDOFF_SECONDS })).toString('base64url');
  return body + '.' + mac('hub-handoff', body);
}

// { email, name } from a handoff token, or null unless it is signed, unexpired, for this host and this nonce.
function readHandoff(token, host, nonce) {
  const [body, sig, extra] = String(token || '').split('.');
  if (extra !== undefined || !body || !sameMac(sig, mac('hub-handoff', body))) return null;
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString());
    const ok = t.host === String(host || '').toLowerCase() && !!nonce && t.nonce === nonce && Date.now() / 1000 < t.exp;
    return ok && t.email ? { email: t.email, name: t.name || t.email } : null;
  } catch (e) {
    return null;
  }
}

module.exports = {
  secret, page, allowedEmails, savedState, safePath, startSession,
  authOrigin, originOf, previewHost, previewState, readPreviewState, handoffToken, readHandoff
};
