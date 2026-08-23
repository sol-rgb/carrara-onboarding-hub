# ⚠️ POps contract — read before editing

This hub is minted and fed by POps (carrara-pops.work), Carrara's People Ops
app. Content is yours: copy, team blurbs, codex.json, styling, the
walkthrough — change freely.

Four things are PLUMBING, added by Eric for cross-app reasons. Do not change
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
4. **clients.json** — POps matches these client names EXACTLY. Renaming or
   removing an entry silently strips the client section from every hub
   minted for that client, with no error anywhere.

Also protected: this Vercel project's environment variables (the mint auth
token and POPS_PLAN_TOKEN). Deleting either kills the POps seam.
