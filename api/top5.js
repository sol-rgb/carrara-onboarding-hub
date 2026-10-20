// Top 5 survey: appends one row per submitted person to a Google Sheet.
// The sheet side is a small Apps Script web app (see README, "Top 5 survey");
// TOP5_SHEET_WEBHOOK holds its /exec URL and is never sent to the browser.
const MAX = { yourName: 120, name: 120, linkedin: 300, company: 160, relationship: 120, year: 4, strength: 1000, notes: 2000 };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const hook = process.env.TOP5_SHEET_WEBHOOK;
  if (!hook) return res.status(503).json({ error: 'not configured' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  // hidden field a person never fills in; a bot that does gets a quiet success
  if (body.website) return res.status(200).json({ ok: true });

  const row = {};
  for (const k of Object.keys(MAX)) {
    const v = body[k];
    if (v != null && typeof v !== 'string') return res.status(400).json({ error: 'bad ' + k });
    row[k] = (v || '').trim().slice(0, MAX[k]);
  }
  if (!row.yourName || !row.name) return res.status(400).json({ error: 'name required' });
  if (row.year && !/^(19|20)\d{2}$/.test(row.year)) return res.status(400).json({ error: 'bad year' });

  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(8000)
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !j.ok) throw new Error('sheet rejected');
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: 'could not save' });
  }
};
