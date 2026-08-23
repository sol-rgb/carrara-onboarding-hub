#!/usr/bin/env node
/* Who is on which client, derived from Slack channel membership.
 *
 * Every client has a #c-<client> channel, so being in that channel is the most
 * current signal we have about who is actually on an account. Notion's client
 * relations are hand-maintained and go stale; this does not.
 *
 * It does NOT replace the Notion relations, it merges with them. Slack tells you
 * who is in the room today, Notion tells you who owns the account. A name in
 * either is kept, and the two sources are logged separately so a surprising
 * result can be traced.
 *
 * Known limits, deliberately not papered over:
 *  - people linger in a channel after the work ends, so this over-reports
 *  - #ext- and #p- channels are ignored; only #c- is treated as an account
 *  - a channel whose name matches no client in clients.json is skipped and named
 *    in the log, which is how new clients get noticed
 *
 * Env: SLACK_BOT_TOKEN (channels:read, users:read).
 * Usage: node scripts/refresh-client-teams.js [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry');
const TOKEN = process.env.SLACK_BOT_TOKEN;

async function slack(method, params) {
  const url = new URL('https://slack.com/api/' + method);
  Object.entries(params || {}).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + TOKEN } });
  const j = await r.json();
  if (!j.ok) throw new Error(method + ': ' + j.error);
  return j;
}

async function paged(method, params, key) {
  const out = [];
  let cursor;
  do {
    const j = await slack(method, Object.assign({}, params, { cursor, limit: '200' }));
    out.push(...(j[key] || []));
    cursor = j.response_metadata && j.response_metadata.next_cursor;
  } while (cursor);
  return out;
}

/* "c-hinge-altana-ops" -> Hinge and Altana. Match the longest client name first
   so "Modal Labs" wins over a shorter accidental substring. */
function clientsForChannel(channel, clientNames) {
  const slug = channel.replace(/^c-/, '').replace(/[^a-z0-9]+/g, '');
  const hits = [];
  clientNames.forEach((name) => {
    const n = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (n.length >= 3 && slug.includes(n)) hits.push(name);
  });
  return hits.sort((a, b) => b.length - a.length).slice(0, 2);
}

(async () => {
  if (!TOKEN) {
    console.error('SLACK_BOT_TOKEN is not set, so channel membership cannot be read.');
    process.exit(1);
  }
  const clients = JSON.parse(fs.readFileSync(path.join(ROOT, 'clients.json'), 'utf8')).clients || [];
  const clientNames = clients.map((c) => c.name);

  const channels = (await paged('conversations.list',
    { types: 'public_channel', exclude_archived: 'true' }, 'channels'))
    .filter((c) => /^c-/.test(c.name));

  const users = await paged('users.list', {}, 'members');
  const nameById = {};
  users.forEach((u) => { if (!u.deleted && !u.is_bot) nameById[u.id] = (u.profile && u.profile.real_name) || u.name; });

  const fromSlack = {};   // person -> Set(client)
  const unmatched = [];
  for (const ch of channels) {
    const hits = clientsForChannel(ch.name, clientNames);
    if (!hits.length) { unmatched.push('#' + ch.name); continue; }
    let ids = [];
    try { ids = await paged('conversations.members', { channel: ch.id }, 'members'); }
    catch (e) { continue; } // not a member of a private-ish channel: skip quietly
    ids.forEach((id) => {
      const person = nameById[id];
      if (!person) return;
      fromSlack[person] = fromSlack[person] || new Set();
      hits.forEach((h) => fromSlack[person].add(h));
    });
  }

  const file = path.join(ROOT, 'people.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // people.json is keyed by Notion names; Slack uses short ones. Bind on a single
  // word first name only when it is unambiguous, the same rule the hub uses.
  const byFirst = {};
  data.people.forEach((p) => {
    const f = p.name.split(/\s+/)[0].toLowerCase();
    byFirst[f] = (byFirst[f] || []).concat(p);
  });
  function findPerson(slackName) {
    const exact = data.people.find((p) => p.name === slackName);
    if (exact) return exact;
    if (slackName.trim().includes(' ')) return null;
    const c = byFirst[slackName.trim().toLowerCase()];
    return c && c.length === 1 ? c[0] : null;
  }

  let added = 0, touched = 0;
  const report = [];
  Object.entries(fromSlack).forEach(([slackName, set]) => {
    const p = findPerson(slackName);
    if (!p) return;
    const before = new Set(p.clients || []);
    const gained = [...set].filter((c) => !before.has(c));
    if (!gained.length) return;
    p.clients = [...before, ...gained].sort();
    p.clientSource = 'notion+slack';
    added += gained.length;
    touched++;
    report.push(p.name + ': +' + gained.join(', '));
  });

  data.updated = new Date().toISOString().slice(0, 10);
  if (!DRY) fs.writeFileSync(file, JSON.stringify(data, null, 1));

  console.log('client channels read:', channels.length - unmatched.length,
    '| people updated:', touched, '| client links added:', added);
  if (unmatched.length) console.log('\nchannels with no matching client in clients.json:\n  ' + unmatched.join(', '));
  if (report.length) console.log('\n' + report.slice(0, 40).join('\n'));
  if (DRY) console.log('\n(dry run, nothing written)');
})().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
