#!/usr/bin/env node
/* Downloads the team's Slack avatars into assets/people and writes the paths
   into team.json.

   The Slack MCP connector does not expose profile images, and api/team.js needs
   SLACK_BOT_TOKEN, which we do not have yet. The avatar CDN, however, serves
   ca.slack-edge.com/<team>-<user>-<hash>-<size> publicly once you know the hash.
   scripts/avatar-ids.txt holds one <user>-<hash> per roster member, in the same
   order as team.json, harvested from the channel member list in the Slack web
   client. Re-harvest it when someone changes their photo; the hash changes with
   the image. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TEAM = 'T27MK8952';
const OUT = path.join(ROOT, 'assets', 'people');
const SIZE = 256;

const slug = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  const ids = fs.readFileSync(path.join(__dirname, 'avatar-ids.txt'), 'utf8')
    .trim().split(',').map((s) => s.trim()).filter(Boolean);
  const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
  const members = team.members;
  if (ids.length !== members.length) {
    console.error(`avatar-ids.txt has ${ids.length} ids for ${members.length} members. Re-harvest.`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  let saved = 0; const skipped = [];
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const id = ids[i];
    if (!id || id === '?') { skipped.push(m.name + ' (no id)'); continue; }
    // An id may carry its own team prefix when the photo is shared across workspaces.
    const key = /^T[A-Z0-9]+-/.test(id) ? id : TEAM + '-' + id;
    // A hash beginning with g is Slack's generated initial-block, not a face.
    if (/-g[0-9a-f]+$/.test(key)) { skipped.push(m.name + ' (default avatar)'); continue; }

    const r = await fetch(`https://ca.slack-edge.com/${key}-512`);
    if (!r.ok) { skipped.push(`${m.name} (HTTP ${r.status})`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    const ext = (r.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg';
    const file = `${slug(m.name)}-${key.split('-').pop().slice(0, 8)}.${ext}`;
    const dest = path.join(OUT, file);
    fs.writeFileSync(dest, buf);
    execFileSync('sips', ['-Z', String(SIZE), dest], { stdio: 'ignore' });
    m.avatar = '/assets/people/' + file;
    saved++;
  }

  fs.writeFileSync(path.join(ROOT, 'team.json'), JSON.stringify(team, null, 1) + '\n');
  console.log(`saved ${saved}/${members.length}`);
  if (skipped.length) console.log('skipped:\n  ' + skipped.join('\n  '));
})().catch((e) => { console.error(e); process.exit(1); });
