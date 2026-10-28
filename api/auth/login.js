// Sends people to Google to sign in. The state cookie ties the callback to this request.
const crypto = require('crypto');
const { safePath } = require('../_lib/signin.js');

module.exports = (req, res) => {
  if (!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) return res.status(503).send('Sign in is not configured yet.');

  const origin = (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host;
  const nextPath = safePath(req.query.next);
  const state = crypto.randomBytes(16).toString('hex');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', origin + '/api/auth/google');
  url.searchParams.set('state', state);
  // Always show the account picker, so people with a personal Google account signed in can pick the carrara.is one.
  url.searchParams.set('prompt', 'select_account');

  res.setHeader('Set-Cookie', 'hub_state=' + state + '|' + encodeURIComponent(nextPath) + '; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600');
  res.redirect(302, url.toString());
};
