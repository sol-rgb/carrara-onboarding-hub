// Profile survey: a new hire's answers go to POps, filed on their profile under
// their planKey. Who they are comes from their signed access code, checked by
// running api/welcome.js itself, so the code format is never re-implemented here.
// Dormant until POPS_PROFILE_TOKEN is set: GET reports whether it is on, POST
// refuses with 503 and makes no call.
const welcome = require('./welcome.js');

const ANSWER_MAX = {
  own_words: 3000, quirks: 1500, high_bar: 1500, misunderstand: 1500,
  feedback: 1500, help_others: 1500, reach_me: 1500, value_in_others: 1500
};
const FIELD_MAX = { email: 200, location: 160, phone: 40, linkedin: 300 };

// Read at call time, like the other POps settings, so a verifier can override it.
function profileUrl() {
  return (process.env.POPS_PROFILE_URL || 'https://carrara-pops.work/api/hub-profile').replace(/\/+$/, '');
}

function whoIs(code) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      setHeader() {},
      status(c) { this.statusCode = c; return this; },
      json(b) { resolve({ status: this.statusCode, body: b }); return this; }
    };
    Promise.resolve(welcome({ method: 'POST', headers: {}, body: { code } }, res))
      .catch(() => resolve({ status: 500, body: null }));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.POPS_PROFILE_TOKEN;
  if (req.method === 'GET') return res.status(200).json({ enabled: !!token });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!token) return res.status(503).json({ error: 'not configured' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const answersIn = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const bad = (v) => v != null && typeof v !== 'string';
  if (bad(body.code) || Object.keys(FIELD_MAX).some((k) => bad(body[k])) || Object.keys(ANSWER_MAX).some((k) => bad(answersIn[k]))) {
    return res.status(400).json({ error: 'bad field' });
  }

  const fields = {};
  Object.keys(FIELD_MAX).forEach((k) => { fields[k] = (body[k] || '').trim().slice(0, FIELD_MAX[k]); });
  const answers = {};
  Object.keys(ANSWER_MAX).forEach((k) => { answers[k] = (answersIn[k] || '').trim().slice(0, ANSWER_MAX[k]); });

  // only the phone is optional
  const missing = ['email', 'location', 'linkedin'].filter((k) => !fields[k])
    .concat(Object.keys(answers).filter((k) => !answers[k]));
  if (missing.length) return res.status(400).json({ error: 'missing', fields: missing });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return res.status(400).json({ error: 'bad email' });

  const who = await whoIs(body.code);
  if (who.status !== 200 || !who.body || !who.body.name) return res.status(401).json({ error: 'bad code' });
  const planKey = who.body.planKey;
  if (!planKey) return res.status(409).json({ error: 'no key' });

  try {
    const r = await fetch(profileUrl() + '/' + encodeURIComponent(planKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(Object.assign({ name: who.body.name }, fields, { answers })),
      signal: AbortSignal.timeout(8000)
    });
    if (r.status === 404 || r.status === 410) return res.status(410).json({ error: 'key retired' });
    if (!r.ok) throw new Error('pops ' + r.status);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: 'could not save' });
  }
};
