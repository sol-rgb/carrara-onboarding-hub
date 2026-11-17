// ⚠️ POPS CONTRACT (see AGENTS.md, item 6): a hire's checklist ticks are saved
// in and read from POps' /api/hub-progress/[key] with POPS_PLAN_TOKEN. The
// env var, the route, the request and response shapes, and the rule that only
// the hire's own sign-in can tick are plumbing: ask Eric before changing them.
//
// The page POSTs { code, save? } here. save is { done: [{ id, label }], total },
// the full current set of ticked items; without it the call is a read. This
// file decodes the code (api/welcome.js's decoder) for the plan key, takes the
// viewer's email from the signed hub_session cookie and NOWHERE else, and asks
// POps:
//
//   POST <POPS_PROGRESS_URL or https://carrara-pops.work/api/hub-progress>/<plan key>
//   Authorization: Bearer <POPS_PLAN_TOKEN>
//   { "viewer_email": "...", "save"?: { "done": [{ "id", "label" }], "total" } }
//
// POps decides who the viewer is: the hire, someone else (viewer, read only),
// or nobody it knows. What reaches the browser:
//   200 { role: "hire" | "viewer", done: { id: ISO time }, total, updated_at }
//   200 { role: "unknown" }  every non-answer: no or bad code, no plan key, no
//                            session, no token, a timeout, a non-200 on a read,
//                            a body that is not an object. The page keeps the
//                            browser's own checklist, exactly as before.
//   403 { refused: true }    POps refused a save (403 or 400), or the save is
//                            outside the contract: the page stops saving.
// Nothing else from POps is passed through, and this file logs nothing: the
// email, the code and the token never appear in a log line or an error body.

const { decode } = require('./welcome.js');
const { readSession } = require('./_lib/signin.js');

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

// Read at call time, like api/welcome.js's planUrl().
function progressUrl() {
  return process.env.POPS_PROGRESS_URL || 'https://carrara-pops.work/api/hub-progress';
}

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

// The browser's save, rebuilt field by field to the contract, or null.
function cleanSave(save) {
  if (!isObj(save) || !Array.isArray(save.done) || save.done.length > 100) return null;
  if (!Number.isInteger(save.total) || save.total < 0 || save.total > 200) return null;
  const seen = new Set();
  const done = [];
  for (const d of save.done) {
    if (!isObj(d) || typeof d.id !== 'string' || !ID_RE.test(d.id) || seen.has(d.id)) return null;
    if (typeof d.label !== 'string' || d.label.length < 1 || d.label.length > 160) return null;
    seen.add(d.id);
    done.push({ id: d.id, label: d.label });
  }
  return { done, total: save.total };
}

// POps' answer, allowlisted: role, done, total, updated_at, and nothing else.
function allow(j) {
  if (!isObj(j) || (j.role !== 'hire' && j.role !== 'viewer')) return { role: 'unknown' };
  const done = {};
  if (isObj(j.done)) {
    for (const [id, at] of Object.entries(j.done)) {
      if (ID_RE.test(id) && typeof at === 'string') done[id] = at;
    }
  }
  return {
    role: j.role,
    done,
    total: Number.isInteger(j.total) && j.total >= 0 ? j.total : null,
    updated_at: typeof j.updated_at === 'string' ? j.updated_at : null
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const unknown = () => res.status(200).json({ role: 'unknown' });
  const refused = () => res.status(403).json({ refused: true });

  const body = req.body;
  if (!isObj(body)) return unknown();
  const who = decode(body.code);
  if (!who || !who.planKey) return unknown();
  const session = readSession(req);
  if (!session) return unknown();
  const token = process.env.POPS_PLAN_TOKEN;
  if (!token) return unknown();

  const saving = body.save !== undefined;
  const payload = { viewer_email: session.email };
  if (saving) {
    const save = cleanSave(body.save);
    if (!save) return refused();
    payload.save = save;
  }

  try {
    const r = await fetch(progressUrl().replace(/\/+$/, '') + '/' + encodeURIComponent(who.planKey), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500)
    });
    if (saving && (r.status === 403 || r.status === 400)) return refused();
    if (r.status !== 200) return unknown();
    return res.status(200).json(allow(await r.json()));
  } catch (e) {
    return unknown();
  }
};
