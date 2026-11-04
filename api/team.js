// Team index, from the first source that answers, in this order:
//   1. POps (Carrara's people directory) when POPS_ROSTER_TOKEN is set:
//      GET {POPS_URL}/api/hub-roster, POPS_URL defaults to https://carrara-pops.work.
//      Edge-cached for an hour. Any failure falls through to 2 or 3 with popsError,
//      cached for five minutes only, so one POps blip is not pinned at the edge
//      for the two weeks the Slack and snapshot answers otherwise get.
//   2. Slack when SLACK_BOT_TOKEN is set (SLACK_CHANNEL_ID optional).
//   3. The bundled team.json snapshot.
// Slack and the snapshot are edge-cached for two weeks.
// Required Slack bot scopes: channels:read, users:read, users:read.email
const { fromRoster, fetchRoster } = require('./_lib/roster.js');

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
  const popsToken = process.env.POPS_ROSTER_TOKEN;
  if (!popsToken) return fromSlackOrSnapshot(req, res);
  try {
    // read globalThis.fetch per request, not at load, so the verifier can stub it
    const json = await fetchRoster(globalThis.fetch, { url: process.env.POPS_URL || 'https://carrara-pops.work', token: popsToken });
    const members = fromRoster(json, snapshot().members);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ source: 'pops', updated: json.generated_at, members });
  } catch (e) {
    const popsError = String((e && e.message) || e);
    // wrap res.json so whatever the Slack or snapshot path answers carries
    // popsError and a short cache, set after that path set its two-week one
    const json = res.json.bind(res);
    res.json = (body) => {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
      return json(Object.assign({}, body, { popsError }));
    };
    return fromSlackOrSnapshot(req, res);
  }
};

async function fromSlackOrSnapshot(req, res) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID || 'C08A7KYJTEE'; // #f-company-ops-general
  // Refresh every two weeks; serve the stale copy while revalidating.
  res.setHeader('Cache-Control', 's-maxage=1209600, stale-while-revalidate=604800');

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
    return res.status(200).json({ source: 'slack', updated: new Date().toISOString(), channel: '#f-company-ops-general', members });
  } catch (e) {
    const snap = snapshot();
    snap.error = String(e.message || e);
    return res.status(200).json(snap);
  }
}
