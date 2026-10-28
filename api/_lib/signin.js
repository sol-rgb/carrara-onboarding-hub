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

module.exports = { secret, page, allowedEmails, savedState, safePath, startSession };
