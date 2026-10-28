// Only Carrara can open the hub. Everyone signs in with Google (same client as
// the Carrara Hub at hub.carrara.is: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and
// AUTH_SECRET are the same values, with this site's /api/auth/google added as
// a redirect URI on that client). The session cookie set by /api/auth/google is
// checked here on every request.
//
// Two ways in without Google:
// - A hire's own link. POps mails ?code=<access code> on day one, sometimes
//   before the hire's carrara.is Google account exists. A valid code (the same
//   signed format api/welcome.js and api/mint.js use) sets a hub_kit cookie and
//   the hire browses as usual. The code already proves who they are.
// - POps and Slack. /api/mint (POps, bearer token) and /api/slack-newhire
//   (Slack, signed requests) check their callers themselves and are left out.
//
// Until GOOGLE_CLIENT_ID is set the site stays open as it is today, so a deploy
// that lands before the env vars changes nothing.

export const config = {
  matcher: ['/((?!api/auth/|api/mint|api/slack-newhire|assets/).*)'],
}

const enc = new TextEncoder()
const DAYS = 30

const fromB64url = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}
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

// The signed hub_session cookie from /api/auth/google. Same format as the Carrara Hub.
export async function readSession(token, secret) {
  const [body, sig] = (token || '').split('.')
  if (!body || !sig) return null
  try {
    const want = await hmac(secret, body)
    if (!same(hex(want), hex(fromB64url(sig)))) return null
    const session = JSON.parse(new TextDecoder().decode(fromB64url(body)))
    return session.exp > Date.now() / 1000 ? session : null
  } catch {
    return null
  }
}

// A hire's access code: "<base64url payload>.<first 10 hex chars of HMAC>",
// exactly as api/mint.js signs it and api/welcome.js decodes it.
export async function validCode(code, secret) {
  const parts = String(code || '').trim().split('.')
  if (parts.length !== 2 || !parts[0] || parts[1].length !== 10) return false
  try {
    const want = hex(await hmac(secret, parts[0])).slice(0, 10)
    return same(want, parts[1])
  } catch {
    return false
  }
}

const cookie = (request, name) =>
  (request.headers.get('cookie') || '')
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1]

export default async function middleware(request) {
  const secret = process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET
  if (!process.env.GOOGLE_CLIENT_ID || !secret) return

  if (await readSession(cookie(request, 'hub_session'), secret)) return

  const url = new URL(request.url)
  const welcomeSecret = process.env.WELCOME_SECRET || process.env.SLACK_SIGNING_SECRET || 'carrara-onboarding-hub'

  // Already in on an access code.
  const kit = cookie(request, 'hub_kit')
  if (kit && (await validCode(decodeURIComponent(kit), welcomeSecret))) return

  // Arriving on the hire's link: remember the code, then load the page as asked.
  // One redirect, marked with hub_kit=1, so a browser that drops the cookie
  // still gets the page instead of a loop.
  const code = url.searchParams.get('code')
  if (code && (await validCode(code, welcomeSecret))) {
    if (url.searchParams.get('hub_kit') === '1') return
    url.searchParams.set('hub_kit', '1')
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        'Set-Cookie': `hub_kit=${encodeURIComponent(code.trim())}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`,
      },
    })
  }

  // Vercel's cron warms /api/team with the CRON_SECRET bearer, when one is set.
  if (process.env.CRON_SECRET && request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`) return

  if (url.pathname.startsWith('/api/')) return new Response(JSON.stringify({ error: 'Sign in required' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const login = new URL('/api/auth/login', url)
  login.searchParams.set('next', url.pathname + url.search)
  return Response.redirect(login, 302)
}
