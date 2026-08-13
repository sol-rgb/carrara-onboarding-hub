// Mint endpoint for POps. POps posts a new hire's details; this returns a
// signed access code and hub URL. Same stateless code format api/welcome.js
// decodes, so nothing else in the hub changes.
//
// Dormant by default: POPS_HUB_TOKEN gates every request, and an *unset*
// POPS_HUB_TOKEN refuses all of them. Deploying this file before the secret
// exists is therefore a no-op — no request can mint a code until someone sets
// POPS_HUB_TOKEN in the Vercel project.

const crypto = require('crypto');

function welcomeSecret() {
  return process.env.WELCOME_SECRET || process.env.SLACK_SIGNING_SECRET || 'carrara-onboarding-hub';
}

function encode(f) {
  const packed = [f.name, f.country, f.project, f.client, f.manager, f.managerId || '']
    .map((v) => encodeURIComponent(v == null ? '' : String(v)))
    .join('|');
  const b64 = Buffer.from(packed, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', welcomeSecret()).update(b64).digest('hex').slice(0, 10);
  return b64 + '.' + sig;
}

// Compare on bytes, not characters: a bearer with the same character count but a
// different byte count would make timingSafeEqual throw instead of returning 401.
function authorized(req) {
  const expected = process.env.POPS_HUB_TOKEN;
  if (!expected) return false; // dormant until the secret is set
  const given = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), 'utf8');
  const want = Buffer.from(expected, 'utf8');
  if (given.length !== want.length) return false;
  return crypto.timingSafeEqual(given, want);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  res.setHeader('Cache-Control', 'no-store');

  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  // Vercel parses JSON bodies, but tolerate a raw string body so a caller that
  // forgets the Content-Type header gets a clear 400 instead of a confusing one.
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  if (!body.name || !body.manager) {
    return res.status(400).json({ error: 'name and manager are required' });
  }

  // project and client fail SOFT downstream: welcome.js resolves the team as
  // config.teams[project] || config.teams.other, and matches the client by
  // exact name. An unrecognized value would silently hand the new hire
  // generic content, so report it instead of swallowing it.
  const config = require('../welcome.json');
  const clients = require('../clients.json').clients || [];
  const warnings = [];
  if (body.project && !config.teams[body.project]) {
    warnings.push("unknown project '" + body.project + "'");
  }
  if (body.country && !config.countries[body.country]) {
    warnings.push("unknown country '" + body.country + "'");
  }
  if (body.client && !clients.some((c) => c.name === body.client)) {
    warnings.push("unknown client '" + body.client + "'");
  }

  // body.extra, body.location and body.employmentType are accepted and ignored:
  // they are not part of the code, and nothing here reads them.
  const code = encode(body);
  const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || '';
  if (!host) warnings.push('could not determine the hub host; use the code, not the url');
  return res.status(200).json({
    url: host ? 'https://' + host + '/?code=' + encodeURIComponent(code) : '',
    code,
    warnings
  });
};
