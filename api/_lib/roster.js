// POps roster for the team page. POps (carrara-pops.work) serves the people
// directory at GET /api/hub-roster behind a bearer token; api/team.js calls it
// when POPS_ROSTER_TOKEN is set. This file is POps plumbing: see AGENTS.md,
// item 5, before changing the route, the header, or the field mapping.

const MIN_MEMBERS = 10; // same guard as scripts/refresh-team.js: never blank the team page

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

// roster: the POps JSON. snapshotMembers: team.json's members (the Slack
// snapshot), used only to carry a photo over until POps sends photo_url.
function fromRoster(roster, snapshotMembers) {
  if (!roster || !Array.isArray(roster.members)) throw new Error('roster: members is not an array');
  const snap = Array.isArray(snapshotMembers) ? snapshotMembers : [];
  const byEmail = new Map();
  const byName = new Map();
  for (const s of snap) {
    const e = str(s && s.email).toLowerCase();
    if (e && s.avatar && !byEmail.has(e)) byEmail.set(e, s.avatar);
    if (s && s.name && s.avatar && !byName.has(s.name)) byName.set(s.name, s.avatar);
  }

  const members = [];
  for (const r of roster.members) {
    const name = str(r && r.full_name);
    if (!name) continue;
    const email = str(r.work_email).toLowerCase();
    const avatar = r.photo_url || (email && byEmail.get(email)) || byName.get(name) || '';
    const mgr = r.manager && str(r.manager.full_name)
      ? { name: str(r.manager.full_name), email: str(r.manager.work_email).toLowerCase() }
      : null;
    members.push({
      name,
      nickname: str(r.preferred_name),
      email,
      title: r.title || '',
      department: r.department || '',
      location: r.location || '',
      avatar,
      isNew: r.status === 'onboarding',
      manager: mgr,
      startDate: r.start_date || '',
      status: r.status
    });
  }
  if (members.length < MIN_MEMBERS) throw new Error('roster: only ' + members.length + ' members');
  members.sort((a, b) => a.name.localeCompare(b.name));
  return members;
}

async function fetchRoster(fetchImpl, { url, token }) {
  const r = await fetchImpl(String(url).replace(/\/+$/, '') + '/api/hub-roster', {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000)
  });
  if (r.status !== 200) throw new Error('roster: HTTP ' + r.status);
  return r.json();
}

module.exports = { fromRoster, fetchRoster };
