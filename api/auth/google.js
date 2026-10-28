// Finishes Sign in with Google. Lets in Carrara Google Workspace accounts
// (verified @carrara.is emails on the carrara.is domain) plus anyone listed in
// ALLOWED_EMAILS, then sets the signed session cookie middleware.js checks.
// Same Google client as the Carrara Hub; this site's URL is one more redirect URI on it.
const { allowedEmails, page, savedState, startSession } = require('../_lib/signin.js');

const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

// The id token comes straight from Google's token endpoint over TLS, so its
// claims can be read without checking the signature (OpenID Connect 3.1.3.7).
const claims = (jwt) => JSON.parse(Buffer.from(String(jwt).split('.')[1] || '', 'base64url').toString() || '{}');

module.exports = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return page(res, 400, 'Google sign in was cancelled.');
  const saved = savedState(req);
  if (!code || !state || state !== saved.state) return page(res, 400, 'That sign in link expired.');

  const origin = (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host;
  const token = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: origin + '/api/auth/google'
    })
  })
    .then((r) => r.json())
    .catch(() => ({}));
  if (!token.id_token) return page(res, 400, 'Google sign in failed.');

  let user;
  try {
    user = claims(token.id_token);
  } catch (e) {
    return page(res, 400, 'Google sign in failed.');
  }
  const email = String(user.email || '').toLowerCase();
  const fresh = ISSUERS.includes(user.iss) && user.aud === process.env.GOOGLE_CLIENT_ID && user.exp > Date.now() / 1000;
  // hd is only set for Google Workspace accounts, so a personal Google account
  // registered with a carrara.is address doesn't count.
  const carrara = user.hd === 'carrara.is' && email.endsWith('@carrara.is');
  if (!fresh || user.email_verified !== true) return page(res, 403, 'Google didn\'t confirm your email. Try again.');
  if (!(carrara || allowedEmails().includes(email))) return page(res, 403, 'You signed in as ' + email.replace(/[<>&"]/g, '') + '. The hub is only for the Carrara team: pick your carrara.is Google account. New joiner? Use the carrara.is account you were given, not a personal Gmail.');

  return startSession(res, { email, name: user.name || email }, saved.next);
};
