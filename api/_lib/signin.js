// What sign in shares: the plain error page, the email rule and the signed
// session cookie that middleware.js checks. Same cookie format as the Carrara Hub.
const crypto = require('crypto');

const DAYS = 30;

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
  const body = Buffer.from(JSON.stringify({ email, name, exp: Math.floor(Date.now() / 1000) + DAYS * 86400 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  res.setHeader('Set-Cookie', [
    'hub_session=' + body + '.' + sig + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DAYS * 86400,
    'hub_state=; Path=/api/auth; Max-Age=0'
  ]);
  res.redirect(302, safePath(nextPath));
}

module.exports = { secret, page, allowedEmails, savedState, safePath, startSession };
