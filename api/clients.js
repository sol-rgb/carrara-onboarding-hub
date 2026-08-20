// Clients index: live from the Notion Client Codex when NOTION_TOKEN is set,
// else the bundled snapshots. Returns { clients: [...], codex: {name: {...}}, updated, source }.
//
// Setup: create an internal integration at notion.so/my-integrations, connect it
// to the Client Codex page in Notion (page menu -> Connections), then set
// NOTION_TOKEN in Vercel env vars and redeploy.
//
// Merge rules: Notion owns status, project types, staffing and the quick pitch;
// codex.json keeps the narrative (about, engagement, overview, background, docs);
// clients.json keeps domain, lead and active workstreams.
// New Active clients in Notion appear automatically; Paused Notion rows only
// show if the brain also tracks them, so the grid doesn't fill with alumni.

const CLIENTS_DS = '29ec97c6-5039-4614-a8e2-19f3fcade3fc';
const PEOPLE_DS = 'bfcd977b-1e24-4363-bd8a-796a480b77e0';

// Notion Codex name -> canonical hub name (clients.json / codex.json key)
const ALIASES = {
  'Modal': 'Modal Labs',
  'Avoca': 'Avoca AI',
  '[Untitled]': 'Untitled',
  'Fundamental': 'Fundamental Technologies',
  'Amazon/Bluush': 'Amazon'
};

// Deliberately hidden from the hub. Roger is a live consumer app whose landing
// page reads as a dating product, which is not the first thing a new joiner
// should meet. Excluded here rather than in the data so a refresh can't undo it.
const EXCLUDE = new Set(['Roger']);

function snapshots() {
  return {
    clients: JSON.parse(JSON.stringify(require('../clients.json'))),
    codex: JSON.parse(JSON.stringify(require('../codex.json')))
  };
}

async function notion(path, body, token) {
  const r = await fetch('https://api.notion.com/v1' + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(path + ': HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}

async function queryAll(dsId, token) {
  const rows = [];
  let cursor;
  do {
    const j = await notion('/data_sources/' + dsId + '/query', cursor ? { start_cursor: cursor } : {}, token);
    rows.push(...(j.results || []));
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}

function plain(prop) {
  if (!prop) return '';
  const arr = prop.title || prop.rich_text || [];
  return arr.map((t) => t.plain_text || '').join('').trim();
}
function relIds(prop) {
  return ((prop && prop.relation) || []).map((r) => r.id);
}

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  // Refresh hourly at the edge; serve stale while revalidating.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const snap = snapshots();
  const brainClients = (snap.clients.clients || []).filter((c) => !EXCLUDE.has(c.name));
  const enrich = Object.fromEntries(
    Object.entries(snap.codex.clients || {}).filter(([name]) => !EXCLUDE.has(name))
  );

  if (!token) {
    return res.status(200).json({
      source: 'snapshot',
      updated: snap.clients.updated || snap.codex.updated || '',
      clients: brainClients,
      codex: enrich
    });
  }

  try {
    const [rows, peopleRows] = await Promise.all([
      queryAll(CLIENTS_DS, token),
      queryAll(PEOPLE_DS, token)
    ]);
    const people = {};
    peopleRows.forEach((p) => { people[p.id] = plain((p.properties || {}).Name); });
    const names = (ids) => ids.map((id) => people[id]).filter(Boolean);

    // one row per canonical name, Active rows win over Paused duplicates
    const byName = {};
    rows.forEach((r) => {
      const p = r.properties || {};
      const raw = plain(p.Name);
      if (!raw || raw.indexOf('{{') >= 0 || /^\[(OLD|v1)\]/i.test(raw) || raw === 'New Teammate') return;
      const name = ALIASES[raw] || raw;
      const entry = {
        name,
        status: (p.Status && p.Status.select && p.Status.select.name) || null,
        projectTypes: ((p['Project Type '] && p['Project Type '].multi_select) || []).map((o) => o.name),
        accountManagers: names(relIds(p['Account Manager'])),
        talentPartners: names(relIds(p['Talent Partner(s)'])),
        coordination: names(relIds(p['Coordination Support'])),
        quickPitch: plain(p['Quick Pitch']) || null,
        website: (p['Company Website'] && p['Company Website'].url) || null
      };
      const prev = byName[name];
      if (!prev || (entry.status === 'Active' && prev.status !== 'Active')) byName[name] = entry;
    });

    const brainByName = {};
    brainClients.forEach((c) => { brainByName[c.name] = c; });

    // union: every canonical Notion client (Active always; Paused only if the
    // brain tracks it) plus brain-only clients (e.g. Roger) that Notion lacks
    const nameSet = new Set(Object.keys(brainByName));
    Object.values(byName).forEach((e) => {
      if (e.status === 'Active' || brainByName[e.name]) nameSet.add(e.name);
    });

    const clients = [];
    const codex = {};
    Array.from(nameSet).filter((n) => !EXCLUDE.has(n)).sort((a, b) => a.localeCompare(b)).forEach((name) => {
      const nx = byName[name] || {};
      const br = brainByName[name] || {};
      const en = enrich[name] || {};
      let domain = br.domain || '';
      if (!domain && nx.website) {
        try { domain = new URL(nx.website).hostname.replace(/^www\./, ''); } catch (e) { /* keep empty */ }
      }
      clients.push({
        name,
        domain,
        lead: br.lead || '',
        description: br.description || '',
        work: br.work || []
      });
      codex[name] = {
        status: nx.status !== undefined && nx.status !== null ? nx.status : (en.status || null),
        projectTypes: (nx.projectTypes && nx.projectTypes.length ? nx.projectTypes : en.projectTypes) || [],
        accountManagers: (nx.accountManagers && nx.accountManagers.length ? nx.accountManagers : en.accountManagers) || [],
        talentPartners: (nx.talentPartners && nx.talentPartners.length ? nx.talentPartners : en.talentPartners) || [],
        coordination: (nx.coordination && nx.coordination.length ? nx.coordination : en.coordination) || [],
        about: en.about || nx.quickPitch || null,
        engagement: en.engagement || [],
        overview: en.overview || {},
        background: en.background || null,
        docs: en.docs || []
      };
    });

    return res.status(200).json({
      source: 'notion',
      updated: new Date().toISOString().slice(0, 10),
      clients,
      codex
    });
  } catch (e) {
    // Notion down or token revoked: serve the snapshots rather than a broken page
    return res.status(200).json({
      source: 'snapshot-fallback',
      error: String(e.message || e).slice(0, 200),
      updated: snap.clients.updated || '',
      clients: brainClients,
      codex: enrich
    });
  }
};
