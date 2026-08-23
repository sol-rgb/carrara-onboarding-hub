#!/usr/bin/env node
/* Rebuilds people.json from the Notion Team Directory (the People Pavilion).
 *
 * Pulls three things the hub cannot get from Slack: what team someone is on,
 * where they are based, and their answers to the Pavilion questions. The answers
 * live in each person's PAGE BODY, not in a property, so this walks every row's
 * page and parses the question list out of the template.
 *
 * A page nobody has filled in still contains every question with an empty bullet
 * under it. Those are dropped, which is what makes the "who has not answered"
 * report at the end meaningful.
 *
 * Env: NOTION_TOKEN. Usage: node scripts/refresh-people.js [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry');
const TOKEN = process.env.NOTION_TOKEN;
const PEOPLE_DS = 'bfcd977b-1e24-4363-bd8a-796a480b77e0';
const CLIENTS_DS = '29ec97c6-5039-4614-a8e2-19f3fcade3fc';

// Question text -> the short key the hub renders. Matching is on the question
// text because that is what actually appears in the page body.
const QUESTIONS = [
  ['honest', /honest, unfiltered things about you/i],
  ['nuts', /what drives you nuts/i],
  ['quirks', /what are your quirks/i],
  ['goldstar', /extra gold star/i],
  ['qualities', /qualities do you particularly value/i],
  ['misunderstand', /might misunderstand about you/i],
  ['coach', /how do you coach people/i],
  ['communicate', /best way to communicate with you/i],
  ['convince', /best way to convince you/i],
  ['givefb', /like to give feedback/i],
  ['getfb', /like to get feedback/i]
];

async function notion(pathname, body) {
  const r = await fetch('https://api.notion.com/v1' + pathname, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(pathname + ': ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r.json();
}

async function queryAll(dsId) {
  const out = [];
  let cursor;
  do {
    const j = await notion('/databases/' + dsId + '/query', cursor ? { start_cursor: cursor } : {});
    out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

const plain = (p) => {
  if (!p) return '';
  const arr = p.title || p.rich_text;
  if (Array.isArray(arr)) return arr.map((x) => x.plain_text).join('').trim();
  if (p.type === 'select') return (p.select && p.select.name) || '';
  if (p.type === 'email') return p.email || '';
  if (p.type === 'url') return p.url || '';
  if (p.type === 'phone_number') return p.phone_number || '';
  return '';
};
const multi = (p) => ((p && p.multi_select) || []).map((o) => o.name);
const rel = (p) => ((p && p.relation) || []).map((r) => r.id.replace(/-/g, ''));

/* Walk a person's page and pull the answers out. Blocks are flat, so a question
   owns every bullet after it until the next question or heading. */
async function answersFor(pageId) {
  const blocks = [];
  let cursor;
  do {
    const q = '?page_size=100' + (cursor ? '&start_cursor=' + cursor : '');
    const j = await notion('/blocks/' + pageId + '/children' + q);
    blocks.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);

  const text = (b) => {
    const t = b[b.type];
    return (t && Array.isArray(t.rich_text) ? t.rich_text.map((x) => x.plain_text).join('') : '').trim();
  };

  const out = [];
  let bg = '', values = '', mode = null, current = null;
  for (const b of blocks) {
    const t = text(b);
    if (!t) continue;
    if (/^my quick background/i.test(t)) { mode = 'bg'; current = null; continue; }
    if (/^these are my core values/i.test(t)) { mode = 'values'; current = null; continue; }
    if (/first set of questions|next set of questions/i.test(t)) { mode = 'q'; current = null; continue; }

    const hit = QUESTIONS.find(([, re]) => re.test(t));
    if (hit) { current = { key: hit[0], q: t.replace(/^\*|\*$/g, '').trim(), a: [] }; out.push(current); mode = 'q'; continue; }

    if (mode === 'bg' && b.type !== 'heading_3') { bg += (bg ? ' ' : '') + t; continue; }
    if (mode === 'values' && b.type !== 'heading_3') { values += (values ? ' ' : '') + t; continue; }
    if (current && /list_item|paragraph/.test(b.type)) current.a.push(t);
  }
  // a question with no bullets under it was never answered
  return { answers: out.filter((x) => x.a.length), background: bg, values: values };
}

(async () => {
  if (!TOKEN) {
    console.error('NOTION_TOKEN is not set, so there is nothing to refresh.');
    process.exit(1);
  }
  const [rows, clientRows] = await Promise.all([queryAll(PEOPLE_DS), queryAll(CLIENTS_DS)]);
  const clientName = {};
  clientRows.forEach((r) => { clientName[r.id.replace(/-/g, '')] = plain((r.properties || {}).Name); });

  const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));
  const wasPartner = {};
  (prev.people || []).forEach((x) => { if (x.partner) wasPartner[x.name] = true; });

  const people = [];
  const noAnswers = [];
  for (const r of rows) {
    const p = r.properties || {};
    const name = plain(p.Name);
    if (!name || name === 'New Teammate') continue;
    const body = await answersFor(r.id);
    const clients = [];
    ['Client(s)', 'Clients (account managed)', 'Clients (coordinated) '].forEach((k) => {
      rel(p[k]).forEach((id) => {
        const n = clientName[id];
        if (n && !clients.includes(n)) clients.push(n);
      });
    });
    if (!body.answers.length) noAnswers.push(name);
    people.push({
      name,
      email: plain(p.Email),
      location: plain(p.Location),
      role: plain(p['Role 1-liner']),
      about: body.background || plain(p['About Yourself']),
      values: body.values,
      linkedin: plain(p.LinkedIn),
      teams: multi(p['Team(s)']),
      clients,
      answers: body.answers.map((x) => ({ q: x.q, a: x.a })),
      // partner is a hub-side judgement, not a Notion field, so it is carried over
      partner: !!wasPartner[name]
    });
  }
  people.sort((a, b) => a.name.localeCompare(b.name));

  const out = {
    source: 'notion-team-directory',
    updated: new Date().toISOString().slice(0, 10),
    _partnerNote: prev._partnerNote,
    people
  };
  if (!DRY) fs.writeFileSync(path.join(ROOT, 'people.json'), JSON.stringify(out, null, 1));

  console.log('people:', people.length,
    '| with answers:', people.filter((x) => x.answers.length).length,
    '| with location:', people.filter((x) => x.location).length,
    '| with clients:', people.filter((x) => x.clients.length).length);
  console.log('\nHave NOT answered the Pavilion questions (' + noAnswers.length + '):');
  console.log(noAnswers.join(', '));
  if (DRY) console.log('\n(dry run, nothing written)');
})().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
