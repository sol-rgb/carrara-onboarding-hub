// Finishes Sign in with Google. Lets in Carrara Google Workspace accounts
// (verified @carrara.is emails on the carrara.is domain) plus anyone listed in
// ALLOWED_EMAILS, then sets the signed session cookie middleware.js checks.
// Same Google client as the Carrara Hub; this site's URL is one more redirect URI on it.
//
// Previews sign in through production (see api/_lib/signin.js): production
// does the Google part and redirects back with ?handoff=, which the preview
// turns into its session here.
const {
  allowedEmails, page, savedState, startSession, originOf, readPreviewState, handoffToken, readHandoff
} = require('../_lib/signin.js');

const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

// The id token comes straight from Google's token endpoint over TLS, so its
// claims can be read without checking the signature (OpenID Connect 3.1.3.7).
const claims = (jwt) => JSON.parse(Buffer.from(String(jwt).split('.')[1] || '', 'base64url').toString() || '{}');

// Swaps the code with Google and applies the Carrara rule: { user } or { status, text }.
async function googleUser(code, redirectUri) {
  const token = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })
    .then((r) => r.json())
    .catch(() => ({}));
  if (!token.id_token) return { status: 400, text: 'Google sign in failed.' };

  let user;
  try {
    user = claims(token.id_token);
  } catch (e) {
    return { status: 400, text: 'Google sign in failed.' };
  }
  const email = String(user.email || '').toLowerCase();
  const fresh = ISSUERS.includes(user.iss) && user.aud === process.env.GOOGLE_CLIENT_ID && user.exp > Date.now() / 1000;
  // hd is only set for Google Workspace accounts, so a personal Google account
  // registered with a carrara.is address doesn't count.
  const carrara = user.hd === 'carrara.is' && email.endsWith('@carrara.is');
  if (!fresh || user.email_verified !== true) return { status: 403, text: 'Google didn\'t confirm your email. Try again.' };
  if (!(carrara || allowedEmails().includes(email))) return { status: 403, text: 'You signed in as ' + email.replace(/[<>&"]/g, '') + '. The hub is only for the Carrara team: pick your carrara.is Google account. New joiner? Use the carrara.is account you were given, not a personal Gmail.' };
  return { user: { email, name: user.name || email } };
}

module.exports = async (req, res) => {
  const { code, state, error, handoff } = req.query;
  // The token rides in the URL for one hop; keep it out of any Referer.
  res.setHeader('Referrer-Policy', 'no-referrer');

  // On a preview, back from production with the signed result.
  if (handoff) {
    const saved = savedState(req);
    const user = readHandoff(handoff, req.headers.host, saved.state);
    if (!user) return page(res, 400, 'That sign in link expired.');
    return startSession(res, user, saved.next);
  }

  if (error) return page(res, 400, 'Google sign in was cancelled.');

  // On production, for a preview: the preview's state cookie lives on the
  // preview, so the signed state stands in for it here and the preview checks
  // its cookie when the handoff arrives.
  const viaPreview = typeof state === 'string' && state.includes(':');
  const preview = viaPreview ? readPreviewState(state) : null;
  if (viaPreview && !preview) return page(res, 400, 'That sign in link expired.');
  const saved = preview ? null : savedState(req);
  if (!code || !state || (saved && state !== saved.state)) return page(res, 400, 'That sign in link expired.');

  const result = await googleUser(code, originOf(req) + '/api/auth/google');
  if (!result.user) return page(res, result.status, result.text);

  if (preview) {
    const back = new URL('https://' + preview.host + '/api/auth/google');
    back.searchParams.set('handoff', handoffToken(result.user, preview.host, preview.nonce));
    return res.redirect(302, back.toString());
  }
  return startSession(res, result.user, saved.next);
};
