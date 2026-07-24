// New joiner profile: posts an intro to #new-hires when SLACK_BOT_TOKEN is set.
// Requires the additional bot scope: chat:write (and the bot invited to #new-hires).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.NEW_HIRES_CHANNEL_ID || 'C0BK7NG1PMM'; // #new-hires
  if (!token) return res.status(200).json({ posted: false, reason: 'no token configured' });

  try {
    const p = req.body || {};
    const lines = ['*New joiner: ' + (p.name || 'Someone new') + '*'];
    if (p.location) lines.push('Location: ' + p.location);
    if (p.work) lines.push('Working on: ' + p.work);
    if (p.fact) lines.push('Fun fact: ' + p.fact);
    const r = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ channel, text: lines.join('\n') })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    return res.status(200).json({ posted: true });
  } catch (e) {
    return res.status(200).json({ posted: false, reason: String(e.message || e) });
  }
};
