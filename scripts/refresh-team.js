#!/usr/bin/env node
/* Weekly team refresh from the #f-company-ops-general Slack channel.
 *
 * Three jobs:
 *  1. Reconcile the roster. Anyone in the channel who is not in team.json is a
 *     joiner; anyone in team.json no longer in the channel has left. Both are
 *     reported by name so the diff is legible in the workflow log.
 *  2. Download each person's Slack photo into assets/people/ and reference the
 *     local file. Slack's CDN URLs are stable enough to render but they are not
 *     ours; committing the image means the hub keeps working if a token lapses.
 *  3. Carry LinkedIn URLs across from people.json and profiles.json, which is
 *     where the LinkedIn research already lives.
 *
 * Env: SLACK_BOT_TOKEN (channels:read, users:read, users:read.email).
 * Usage: node scripts/refresh-team.js [--dry]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PHOTOS = path.join(ROOT, 'assets', 'people');
const DRY = process.argv.includes('--dry');
const TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL = process.env.SLACK_CHANNEL_ID || 'C08A7KYJTEE';

async function slack(method, params) {
  const url = new URL('https://slack.com/api/' + method);
  Object.entries(params || {}).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + TOKEN } });
  const j = await r.json();
  if (!j.ok) throw new Error(method + ': ' + j.error);
  return j;
}

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* Save the photo next to the repo. The hash in the filename means a changed
   photo lands as a new file and the old one stops being referenced, so the
   browser never serves a stale cached face. */
async function savePhoto(name, url) {
  if (!url) return '';
  const r = await fetch(url);
  if (!r.ok) return '';
  const buf = Buffer.from(await r.arrayBuffer());
  const ext = (url.match(/\.(png|jpe?g|gif|webp)(\?|$)/i) || [, 'jpg'])[1].toLowerCase();
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const file = slug(name) + '-' + hash + '.' + ext;
  if (!DRY) {
    fs.mkdirSync(PHOTOS, { recursive: true });
    fs.writeFileSync(path.join(PHOTOS, file), buf);
  }
  return '/assets/people/' + file;
}

(async () => {
  if (!TOKEN) {
    console.error('SLACK_BOT_TOKEN is not set, so there is nothing to refresh.');
    process.exit(1);
  }

  const ids = new Set();
  let cursor;
  do {
    const j = await slack('conversations.members', { channel: CHANNEL, limit: '200', cursor });
    j.members.forEach((m) => ids.add(m));
    cursor = j.response_metadata && j.response_metadata.next_cursor;
  } while (cursor);

  const members = [];
  cursor = undefined;
  do {
    const j = await slack('users.list', { limit: '200', cursor });
    for (const u of j.members) {
      if (!ids.has(u.id) || u.deleted || u.is_bot || u.id === 'USLACKBOT') continue;
      const p = u.profile || {};
      members.push({
        name: p.real_name || u.name,
        title: p.title || '',
        email: p.email || '',
        slackId: u.id,
        remote: p.image_512 || p.image_192 || ''
      });
    }
    cursor = j.response_metadata && j.response_metadata.next_cursor;
  } while (cursor);

  if (members.length < 10) {
    console.error('Only ' + members.length + ' members came back. Refusing to overwrite the roster.');
    process.exit(1);
  }
  members.sort((a, b) => a.name.localeCompare(b.name));

  const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
  const before = new Set((prev.members || []).map((m) => m.name));
  const after = new Set(members.map((m) => m.name));
  const joined = members.filter((m) => !before.has(m.name)).map((m) => m.name);
  const left = (prev.members || []).filter((m) => !after.has(m.name)).map((m) => m.name);

  // LinkedIn from wherever we already have it
  const li = {};
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8')).people
      .forEach((x) => { if (x.linkedin) li[x.name] = x.linkedin; });
  } catch (e) { /* first run */ }
  try {
    const pr = JSON.parse(fs.readFileSync(path.join(ROOT, 'profiles.json'), 'utf8')).profiles || {};
    Object.entries(pr).forEach(([n, v]) => { if (v.linkedin && !li[n]) li[n] = v.linkedin; });
  } catch (e) { /* optional */ }

  const prevPhoto = {};
  (prev.members || []).forEach((m) => { if (m.avatar) prevPhoto[m.name] = m.avatar; });

  let downloaded = 0;
  for (const m of members) {
    const local = await savePhoto(m.name, m.remote);
    if (local) { m.avatar = local; downloaded++; } else if (prevPhoto[m.name]) { m.avatar = prevPhoto[m.name]; }
    delete m.remote;
    const link = li[m.name];
    if (link) m.linkedin = /^https?:/.test(link) ? link : 'https://' + link;
  }

  const out = { source: prev.source || 'snapshot', updated: new Date().toISOString().slice(0, 10),
    channel: prev.channel || '#f-company-ops-general', members };
  if (!DRY) fs.writeFileSync(path.join(ROOT, 'team.json'), JSON.stringify(out, null, 1) + '\n');

  console.log('roster:', members.length, '| photos saved:', downloaded,
    '| with linkedin:', members.filter((m) => m.linkedin).length);
  if (joined.length) console.log('JOINED:', joined.join(', '));
  if (left.length) console.log('LEFT  :', left.join(', '));
  if (!joined.length && !left.length) console.log('no roster change this week');
  if (DRY) console.log('(dry run, nothing written)');
})().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
