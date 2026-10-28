// Only Carrara can open the hub. Everyone signs in with Google. GOOGLE_CLIENT_ID
// and GOOGLE_CLIENT_SECRET are the "Carrara Onboarding Hub" client in Carrara's
// own Google Cloud project (pops), whose audience is Internal, so Google itself
// turns away anyone outside carrara.is; this site's /api/auth/google is one of
// its redirect URIs. AUTH_SECRET (optional) signs the session cookie, which
// /api/auth/google sets and this file checks on every request.
//
// What gets in: a signed Carrara Google session. What does not: an access code
// on its own. A hire's link (?code=<access code>) goes to Google like any other
// page, with the code kept in the login's next= parameter. After sign in the
// hire lands back on /?code=..., where app.js reads the code and unlocks their
// kit. So a hire needs their carrara.is Google account first (ALLOWED_EMAILS
// is the list for anyone without one).
//
// A session ends after 60 minutes without use, and after 24 hours in any case.
// Then Google is asked again, which is also what shuts out a leaver: a
// suspended Workspace account is refused at the next sign in. Any GET after
// five quiet minutes gets one redirect to the same address with a fresh cookie,
// which is how "use" is counted. The page moves between its sections with hash
// links and fetches /api/... for their data, so those fetches count too; a
// fetch follows the redirect on its own. Posts are only checked.
//
// Left outside the login: /api/mint (POps, bearer token) and /api/slack-newhire
// (Slack, signed requests) check their callers themselves, and Vercel's cron
// warms /api/team with the CRON_SECRET bearer.
//
// Until GOOGLE_CLIENT_ID is set the site stays open as it is today, so a deploy
// that lands before the env vars changes nothing.

// A session ends after this long without a request.
const IDLE_SECONDS = 60 * 60
// A session ends this long after sign in, however busy. api/_lib/signin.js writes it into exp.
const MAX_SECONDS = 24 * 60 * 60
// A GET refreshes "last use" once it is this old, so most requests set no cookie.
const REFRESH_SECONDS = 5 * 60

export const config = {
  matcher: ['/((?!api/auth/|api/mint|api/slack-newhire|assets/).*)'],
}

const enc = new TextEncoder()

const fromB64url = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}
const toB64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', key, enc.encode(text))
}

const same = (a, b) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// The signed hub_session cookie from /api/auth/google: { email, name, iat, seen, exp }
// in unix seconds. Good until exp, and only while seen is within the last hour.
export async function readSession(token, secret, now = Date.now() / 1000) {
  const [body, sig] = (token || '').split('.')
  if (!body || !sig) return null
  try {
    const want = await hmac(secret, body)
    if (!same(hex(want), hex(fromB64url(sig)))) return null
    const session = JSON.parse(new TextDecoder().decode(fromB64url(body)))
    return now < session.exp && now - session.seen <= IDLE_SECONDS ? session : null
  } catch {
    return null
  }
}

// The same session with seen moved to now, signed the way api/_lib/signin.js signs it.
async function refreshed({ email, name, iat, exp }, secret, now) {
  const body = toB64url(enc.encode(JSON.stringify({ email, name, iat, seen: Math.floor(now), exp })))
  const sig = toB64url(await hmac(secret, body))
  return `hub_session=${body}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(exp - now)}`
}

const cookie = (request, name) =>
  (request.headers.get('cookie') || '')
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1]

export default async function middleware(request) {
  const secret = process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET
  if (!process.env.GOOGLE_CLIENT_ID || !secret) return

  const url = new URL(request.url)
  const now = Date.now() / 1000
  const session = await readSession(cookie(request, 'hub_session'), secret, now)
  if (session) {
    // Any GET after five quiet minutes: one redirect to the same address with a
    // fresh cookie. A page's data fetches count as use too (the page itself
    // navigates by hash, so they may be the only requests for an hour). Never
    // on a post: a 302 would turn it into a GET.
    if (request.method === 'GET' && now - session.seen >= REFRESH_SECONDS) {
      return new Response(null, {
        status: 302,
        headers: { Location: request.url, 'Set-Cookie': await refreshed(session, secret, now), 'Cache-Control': 'no-store' },
      })
    }
    return
  }

  // Vercel's cron warms /api/team with the CRON_SECRET bearer, when one is set.
  if (process.env.CRON_SECRET && request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`) return

  if (url.pathname.startsWith('/api/')) return new Response(JSON.stringify({ error: 'Sign in required' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const login = new URL('/api/auth/login', url)
  login.searchParams.set('next', url.pathname + url.search)
  return Response.redirect(login, 302)
}
