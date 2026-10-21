// Clients and practices from the Carrara Knowledge Hub (hub.carrara.is): live
// from its /api/onboarding-export when KNOWLEDGE_HUB_KEY is set, else the
// bundled knowledge.json snapshot. The Knowledge Hub is the source of truth for
// clients, practices and teams; see README, "Clients and offerings from the
// Carrara Hub". Edge-cached for an hour, stale copy served while refreshing.
//
// Env: KNOWLEDGE_HUB_KEY, the shared key (ONBOARDING_EXPORT_KEY on the other
// project). KNOWLEDGE_HUB_URL optional, defaults to https://hub.carrara.is.
function snapshot() {
  // require so the bundler traces and includes the file
  const snap = JSON.parse(JSON.stringify(require('../knowledge.json')));
  snap.source = 'snapshot';
  return snap;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  const key = process.env.KNOWLEDGE_HUB_KEY;
  if (!key) return res.status(200).json(snapshot());
  const base = (process.env.KNOWLEDGE_HUB_URL || 'https://hub.carrara.is').replace(/\/$/, '');
  try {
    const r = await fetch(base + '/api/onboarding-export', { headers: { 'x-hub-key': key }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (!data || !Array.isArray(data.clients) || data.clients.length < 5) throw new Error('empty export');
    data.source = 'hub';
    return res.status(200).json(data);
  } catch (e) {
    const snap = snapshot();
    snap.error = String(e && e.message || e);
    return res.status(200).json(snap);
  }
};
