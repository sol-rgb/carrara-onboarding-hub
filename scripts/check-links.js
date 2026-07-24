// Checks every external URL referenced by the hub and fails if any are dead.
// Run locally with `node scripts/check-links.js`, or let the weekly GitHub Action run it.
// Note: Notion and Google links return their login page (200) even when moved,
// so this mainly catches deleted pages, bad domains, and typos.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = ['index.html', 'links.js', 'app.js', 'welcome.json', 'README.md'];

const urls = new Set();
for (const f of FILES) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of text.matchAll(/https?:\/\/[^\s"'<>\\)\]]+/g)) {
    const u = m[0].replace(/[.,;]+$/, '');
    // skip templated/example URLs, code URL-prefixes, and per-request API endpoints
    if (u.includes('<') || u.includes('slack.com/api') || u.includes('google.com/s2/favicons')) continue;
    if (u.endsWith('/') || u.endsWith('=')) continue; // concatenation prefixes in app.js
    urls.add(u);
  }
}
// client sites from clients.json
for (const c of JSON.parse(fs.readFileSync(path.join(ROOT, 'clients.json'), 'utf8')).clients) {
  if (c.domain) urls.add('https://' + c.domain);
}

async function check(u) {
  try {
    const r = await fetch(u, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; carrara-hub-linkcheck)' }
    });
    // 401/403/999 mean auth-gated or bot-blocked, not a dead page
    return { u, ok: r.status < 400 || r.status === 401 || r.status === 403 || r.status === 999, status: r.status };
  } catch (e) {
    return { u, ok: false, status: String(e.cause?.code || e.name) };
  }
}

(async () => {
  const results = await Promise.all([...urls].map(check));
  const dead = results.filter((r) => !r.ok);
  console.log(`Checked ${results.length} URLs.`);
  for (const r of results) console.log(`${r.ok ? 'ok  ' : 'DEAD'} [${r.status}] ${r.u}`);
  if (dead.length) {
    console.error(`\n${dead.length} dead link(s) found.`);
    process.exit(1);
  }
})();
