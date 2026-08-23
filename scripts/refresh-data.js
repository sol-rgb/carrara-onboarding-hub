#!/usr/bin/env node
/* Weekly refresh of the bundled snapshots: team.json, clients.json, codex.json.
 *
 * These snapshots are what the hub renders whenever the live API tokens are not
 * configured, so leaving them stale means the site quietly shows old data. This
 * script re-runs the same handlers the API uses (no duplicated Slack or Notion
 * logic) and writes the result back to disk.
 *
 * It only overwrites a snapshot when the fetch actually reached the source.
 * A handler that falls back returns the snapshot it was given, and writing that
 * back would be a no-op at best and could stamp a fresh date on stale data.
 *
 * Env: SLACK_BOT_TOKEN refreshes the team, NOTION_TOKEN refreshes the clients.
 * Either can be absent; that part is skipped and reported rather than failing.
 *
 * Usage: node scripts/refresh-data.js [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry');

// Run an API handler in-process and hand back whatever it passes to res.json().
function invoke(handlerPath) {
  const handler = require(handlerPath);
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      setHeader() { return this; },
      status(c) { this.statusCode = c; return this; },
      json(payload) { resolve(payload); return this; }
    };
    Promise.resolve(handler({ method: 'GET', query: {}, headers: {} }, res)).catch(reject);
  });
}

// Match the existing files: 1-space indent, and keep each file's trailing-newline
// habit so the first run doesn't produce a diff made entirely of whitespace.
function write(file, data) {
  const full = path.join(ROOT, file);
  const had = fs.existsSync(full) && fs.readFileSync(full, 'utf8').endsWith('\n');
  const next = JSON.stringify(data, null, 1) + (had ? '\n' : '');
  const prev = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  if (prev === next) return 'unchanged';
  if (!DRY) fs.writeFileSync(full, next);
  return 'updated';
}

const today = () => new Date().toISOString().slice(0, 10);
const log = (...a) => console.log(...a);

async function refreshTeam() {
  if (!process.env.SLACK_BOT_TOKEN) return log('team     skipped, SLACK_BOT_TOKEN not set');
  const data = await invoke(path.join(ROOT, 'api/team.js'));
  if (data.source !== 'slack') {
    log('team     FAILED, handler fell back:', data.error || 'no token reached Slack');
    return 'fail';
  }
  const members = data.members || [];
  if (members.length < 10) { log('team     FAILED, only', members.length, 'members returned'); return 'fail'; }
  const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
  // keep source as "snapshot": this file IS the snapshot, and the UI switches its
  // wording on source === "slack", which would misreport a static file as live
  const out = { source: prev.source || 'snapshot', updated: today(), channel: data.channel || prev.channel, members };
  const withPhoto = members.filter((m) => m.avatar).length;
  log('team    ', write('team.json', out), '|', members.length, 'members,', withPhoto, 'with photos');
}

async function refreshClients() {
  if (!process.env.NOTION_TOKEN) return log('clients  skipped, NOTION_TOKEN not set');
  const data = await invoke(path.join(ROOT, 'api/clients.js'));
  if (data.source !== 'notion') {
    log('clients  FAILED, handler fell back:', data.error || 'no token reached Notion');
    return 'fail';
  }
  const clients = data.clients || [];
  if (clients.length < 5) { log('clients  FAILED, only', clients.length, 'clients returned'); return 'fail'; }

  const prevC = JSON.parse(fs.readFileSync(path.join(ROOT, 'clients.json'), 'utf8'));
  const prevX = JSON.parse(fs.readFileSync(path.join(ROOT, 'codex.json'), 'utf8'));
  log('clients ', write('clients.json', { source: prevC.source, updated: today(), clients }), '|', clients.length, 'clients');
  log('codex   ', write('codex.json', { source: prevX.source, updated: today(), clients: data.codex || {} }),
    '|', Object.keys(data.codex || {}).length, 'entries');
}

(async () => {
  if (!process.env.NOTION_TOKEN) {
    // fail rather than pass: a scheduled job that quietly does nothing every week
    // is worse than one that goes red the first time it runs misconfigured
    console.error('NOTION_TOKEN is not set, so the Client Codex cannot be read.');
    console.error('Add them as repository secrets, or run locally with them exported.');
    process.exit(1);
  }
  // team.json is refresh-team.js's job now: it also downloads the photos.
  const results = [await refreshClients()];
  if (results.includes('fail')) {
    console.error('\nAt least one source failed. Snapshots left untouched for that source.');
    process.exit(1);
  }
  log('\nDone.' + (DRY ? ' (dry run, nothing written)' : ''));
})();
