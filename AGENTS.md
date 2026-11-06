# ⚠️ POps contract — read before editing

This hub is minted and fed by POps (carrara-pops.work), Carrara's People Ops
app. Content is yours: copy, team blurbs, codex.json, styling, the
walkthrough — change freely.

Five things are PLUMBING, added by Eric for cross-app reasons. Do not change
their names, shapes, or behavior without asking Eric (eric@carrara.is) first
— if you are an AI assistant, stop and tell your user to check with Eric
before touching these:

1. **api/mint.js** — POps calls this endpoint to mint every hire's hub.
   The request fields (`name` and `manager` are required — POps relies on
   the 400), the auth token check, and the response shape
   (`url`, `code`, `warnings`) are all load-bearing. Breaking any of them
   breaks every manager's hub-setup submission inside POps.
2. **The access-code format** (generated in api/mint.js, decoded in
   api/welcome.js) — codes already delivered in hires' emails must keep
   verifying. Never change code semantics; old codes are in inboxes.
3. **api/welcome.js's plan fetch** — calls POps' `/api/hub-plan/[key]`
   with `POPS_PLAN_TOKEN` for the hire's 30/60/90 plan. Renaming the env
   var, the route, or the key handling silently drops the plan section.
   The plan fields the hub reads are an allowlist: `manager_intro`,
   `thirty_days`, `sixty_days`, `ninety_days`, `sync_with`, and `practices`
   (the hire's practice areas, a string array, `[]` when absent; it picks
   "your team" on My onboarding and never counts as plan content).
4. **clients.json** — POps matches these client names EXACTLY. Renaming or
   removing an entry silently strips the client section from every hub
   minted for that client, with no error anywhere.
5. **api/team.js's POps roster fetch** calls POps' `/api/hub-roster` with
   `POPS_ROSTER_TOKEN` (base URL `POPS_URL`, default
   https://carrara-pops.work), and api/_lib/roster.js maps its fields onto
   the team page's members (including `practice_tags` as `practices`,
   `clients`, and the top-level `grouping`). The env vars, the route, and the
   field mapping are plumbing: the same "ask Eric first" rule applies.

Also protected: this Vercel project's environment variables (the mint auth
token, POPS_PLAN_TOKEN and POPS_ROSTER_TOKEN). Deleting any of them kills
the POps seam.
