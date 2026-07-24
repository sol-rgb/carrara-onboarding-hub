// Team index: live from Slack when SLACK_BOT_TOKEN is set, else the bundled snapshot.
// Required Slack bot scopes: channels:read, users:read, users:read.email
function snapshot() {
  // require so the bundler traces and includes the file
  return JSON.parse(JSON.stringify(require('../team.json')));
}

async function slackGet(method, params, token) {
  const url = new URL('https://slack.com/api/' + method);
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json();
  if (!j.ok) throw new Error(method + ': ' + j.error);
  return j;
}

module.exports = async (req, res) => {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID || 'C27MYMF3K'; // #g-announcements
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (!token) {
    const snap = snapshot();
    return res.status(200).json(snap);
  }

  try {
    const ids = new Set();
    let cursor;
    do {
      const j = await slackGet('conversations.members', { channel, limit: '200', cursor }, token);
      j.members.forEach((m) => ids.add(m));
      cursor = j.response_metadata && j.response_metadata.next_cursor;
    } while (cursor);

    const members = [];
    cursor = undefined;
    do {
      const j = await slackGet('users.list', { limit: '200', cursor }, token);
      for (const u of j.members) {
        if (!ids.has(u.id) || u.deleted || u.is_bot || u.id === 'USLACKBOT') continue;
        const p = u.profile || {};
        members.push({
          name: p.real_name || u.name,
          title: p.title || '',
          email: p.email || '',
          avatar: p.image_192 || ''
        });
      }
      cursor = j.response_metadata && j.response_metadata.next_cursor;
    } while (cursor);

    members.sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json({ source: 'slack', updated: new Date().toISOString(), channel: '#g-announcements', members });
  } catch (e) {
    const snap = snapshot();
    snap.error = String(e.message || e);
    return res.status(200).json(snap);
  }
};
