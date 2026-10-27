# Carrara Onboarding Hub

Multi-section onboarding hub for new joiners. Static app + two serverless functions, deployed on Vercel.

## Live data

The site works with zero configuration using bundled snapshots. Two optional env vars turn on live refresh (set them in Vercel, Project Settings, Environment Variables, then redeploy):

### Team index (Slack)

- `SLACK_BOT_TOKEN`: a bot token from a Slack app installed in the carrarais workspace, with scopes `channels:read`, `users:read`, `users:read.email`.
- `SLACK_CHANNEL_ID`: optional, defaults to `C08A7KYJTEE` (#f-company-ops-general).

With the token set, `/api/team` pulls the live member list, titles and avatars from Slack. The response is edge-cached for two weeks, and a Vercel cron (`vercel.json`) re-warms it on the 1st and 15th of each month, so the team page refreshes on a biweekly cadence. Without the token, the bundled `team.json` snapshot (#f-company-ops-general members as of Jul 24, 2026, no photos) is served.

To create the Slack app: api.slack.com/apps, Create New App, add the three scopes under OAuth and Permissions, install to workspace, copy the Bot User OAuth Token.

### Branding folder (Google Drive)

- `GOOGLE_API_KEY`: a Google Cloud API key with the Drive API enabled.
- `BRAND_FOLDER_ID`: optional, defaults to the branding folder.

With the key set (and the folder shared as "anyone with the link can view"), `/api/templates` lists the folder and the site embeds each file individually. Without it, the site falls back to Google's embedded folder view iframe, which also stays in sync automatically.

### New hires bot (Slack)

`/api/slack-newhire` powers the survey bot for #new-hires and the personalized welcome kit popup on the hub.

The flow: the hiring manager types `/new-hire` in Slack. A modal asks for the new joiner's name, country (US / Argentina / Australia / other), project type (talent / finance / go-to-market / other), and first client (picked from clients.json). Submitting generates a signed access code, posts it with the details to #new-hires, and shows it to the manager in the modal. The manager sends the code to the new joiner.

The new joiner opens the hub and pastes the code into the welcome kit popup (sticky, bottom right). The popup unlocks a kit personalized to them: their hiring manager, who to sync with in week one (the manager's own list when POps has one, otherwise the client lead from clients.json plus team defaults), their first client with links, and how their team works. The kit persists in their browser via localStorage.

Payroll, invoicing and tax specifics are deliberately **not** here — the day-one comms POps sends carry them per employment type, and two sources of truth on someone's pay is one too many. The kit shows a single generic pointer instead (`payNote` in `welcome.json`).

Codes are stateless: the survey answers travel inside the code, signed with `WELCOME_SECRET`, so there is no database. `/api/welcome` verifies and unpacks them. All kit content is editable in `welcome.json` (teams, country labels, links); client facts come from `clients.json`.

One-time Slack app setup:

1. api.slack.com/apps, Create New App ("New Hires"), workspace carrarais.
2. Slash command `/new-hire`, request URL `https://<domain>/api/slack-newhire`.
3. Interactivity: on, same request URL.
4. Bot token scopes: `commands`, `chat:write`, `users:read` (plus `channels:read`, `users:read.email` if the same app powers the team index).
5. Install to workspace, invite the bot to #new-hires (channel ID C0BK7NG1PMM).
6. Vercel env vars: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `WELCOME_SECRET` (any long random string; keeps access codes forgery-proof), optional `NEW_HIRES_CHANNEL_ID`. Redeploy.

`/api/profile` uses the same token to post new joiner self-intros from the team page.

### Clients and offerings from the Carrara Hub (`/api/knowledge`)

The Carrara Knowledge Hub (hub.carrara.is, repo `sol-rgb/carrara-knowledge-hub`) is the source of truth for which clients we have, what we are doing for them, who is on each team and what each offering runs. `/api/knowledge` fetches all of that from the hub's `/api/onboarding-export` (built fresh on every hub deploy), caches it at the edge for an hour, and falls back to the bundled `knowledge.json` snapshot when the key is missing or the hub doesn't answer.

- `KNOWLEDGE_HUB_KEY`: the shared key, the same value as `ONBOARDING_EXPORT_KEY` on the hub's Vercel project. Without it, the snapshot is served.
- `KNOWLEDGE_HUB_URL`: optional, defaults to `https://hub.carrara.is`.

What it changes on the site:

- Clients: a client the Knowledge Hub knows takes its status (active, paused, past), one liner, practice tags, current workstreams, team and a link to its full page. The Client Codex snapshot still supplies the company facts, docs and the entries the Knowledge Hub does not track. Clients that only exist on the Knowledge Hub get a card too; their names are also in `clients.json` so POps can match them.
- Offerings (the Carrara section): each offering page lists the Knowledge Hub's active clients for that practice, the services it runs, who to ask, and links to the practice on the hub.
- Team: a person's client logos include the active client teams the Knowledge Hub keeps.

Without the file the site renders exactly as before, from the Codex alone. Edit clients, practices and teams on the Knowledge Hub (`src/data/*.ts` there), never here. To refresh the bundled snapshot: in the hub repo, `node scripts/export-onboarding.mjs ../carrara-onboarding-hub/knowledge.json`.

### Top 5 survey (Google Sheet)

The "Submit your Top 5" checklist item opens a survey inside the hub. Each submission is one person, and `/api/top5` forwards it to a Google Sheet through a small Apps Script web app. Without `TOP5_SHEET_WEBHOOK` set, the endpoint answers 503 and the form shows an error.

One-time setup:

1. Create a Google Sheet (any name, e.g. "Top 5 responses"). Leave it empty; the script writes the header row on the first submission.
2. In the sheet: Extensions, Apps Script. Replace the contents with:

```js
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Submitted', 'Submitted by', 'Name', 'LinkedIn', 'Company', 'Relationship type', 'Year', 'What were they amazing at?', 'Notes']);
    }
    var row = [new Date().toISOString(), d.yourName, d.name, d.linkedin, d.company, d.relationship, d.year, d.strength, d.notes]
      .map(function (v) { return v || ''; });
    // plain-text format so a value starting with = or + is stored as text, never run as a formula
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Deploy, New deployment, type Web app. Execute as: Me. Who has access: Anyone. Authorize when asked, then copy the Web app URL (ends in `/exec`).
4. Vercel env var `TOP5_SHEET_WEBHOOK` = that URL. Redeploy.

Editing the script later needs Deploy, Manage deployments, Edit, New version; the URL stays the same.

### Access codes from POps (`/api/mint`)

`POST /api/mint` lets Carrara's People Ops app (POps) generate a welcome-kit access code without a hiring manager running `/new-hire` in Slack — POps already knows the new joiner's details, so it mints the code and sends it with the welcome email. The code is the same signed, stateless format the Slack flow produces; `/api/welcome` decodes both identically, so nothing else in the hub changes.

- `POPS_HUB_TOKEN`: a shared secret (any long random string), set in Vercel env vars here and in POps. Requests authenticate with an `Authorization: Bearer <token>` header.

Request body: `{ name, country, project, client, manager, managerId, planKey }` — the same survey answers the Slack modal collects, plus the manager's Slack user id. `country` is one of `US` / `AR` / `AU` / `OTHER`, `project` one of `talent` / `finance` / `gtm` / `other`, `client` an exact name from `clients.json`. `name` and `manager` are required; everything else is optional. Every value must be a string or null — a number or object is refused with a 400 rather than coerced into the code.

`planKey` is the opaque token POps mints per hub enable. It is packed into the code as its seventh field and handed back to POps at view time to fetch the hire's 30/60/90 plan. Null or absent is legal: the kit renders without the plan block.

Response: `{ url, code, warnings }`.

- `code` is the payload that matters: the new joiner pastes it into the welcome kit popup, and POps shows it in the welcome email. Nothing else unlocks the kit.
- `url` opens the hub with the code in the query string, and the front-end consumes it: following the link unlocks the welcome kit automatically (the popup opens already personalized, and the code is scrubbed from the address bar). A bad or expired code falls back to the normal locked popup with the usual error, where pasting still works — so the email should carry both the link and the code, link as the main path, code as the fallback.
- `warnings` is an array of strings.

**Dormant by default.** With `POPS_HUB_TOKEN` unset, every request is refused with a 401, so deploying this endpoint before the secret exists is a no-op. That is what makes shipping it to `main`, which deploys automatically, safe: the endpoint only wakes up when someone sets the env var.

`extra`, `location` and `employmentType` are accepted and ignored — POps sends them on every request so this side can start consuming them later without a contract change.

`warnings` reports an unrecognized `project`, `country` or `client` instead of failing, because those values fail soft downstream: an unknown project quietly yields the generic kit rather than an error. The client check reads the bundled `clients.json`, so a client that exists only in Notion (served live by `/api/clients`) warns even though it is real — acceptable for now; add it to `clients.json` or ignore that warning.

After any change to the code format, on either side, run `WELCOME_SECRET=test-secret node scripts/verify-mint.js` **and** `WELCOME_SECRET=test-secret node scripts/verify-my-onboarding.js`. The first mints a code and decodes it with `api/welcome.js`'s own logic, six-field and seven-field alike, and exercises the auth gate. The second covers everything the plan key unlocks: the POps call, the vendored Markdown renderer, the section's reveal state machine and its rendering. Both print `... OK` and exit non-zero on any mismatch.

### The hire's plan from POps (`/api/hub-plan`)

The welcome kit's "My Onboarding" section shows what the hiring manager wrote in
POps: an intro note, the first client, who to sync with in week one, and a
30/60/90 plan. That text is too long to travel inside an access code, so
`/api/welcome` fetches it server-side, once per view, from POps.

- `POPS_PLAN_TOKEN`: a shared secret, its own — **not** `POPS_HUB_TOKEN`, so the
  two directions rotate independently. Set it here and in POps' Vercel project.
- `POPS_PLAN_URL`: optional, defaults to `https://carrara-pops.work/api/hub-plan`.

**Dormant by default.** With `POPS_PLAN_TOKEN` unset, `/api/welcome` makes no
call at all, and every kit renders exactly as it does today.

Nothing about this can break a kit. A missing plan key, an unset secret, a
retired key (POps rotates it on every re-enable), a 404, an outage or a
malformed body all end the same way: the kit renders without the plan block.

The 30/60/90 bodies are Markdown in POps' comms subset. `markdown.js` is a
**vendored copy of POps' `src/lib/comms/markdown.ts`** — escape-first, and the
only HTML-producing path here fed by text typed in another app. Do not edit it;
re-copy it and re-run the verifier.

### The hire's profile survey (`/api/profile-answers`)

The "Fill out your profile" checklist step can open a survey inside the hub, and send the answers to POps so they are filed on the hire's own profile. Completion is then visible in POps: a profile with answers is a finished one. The hub also ticks the checklist box.

**Dormant by default.** With `POPS_PROFILE_TOKEN` unset, `GET /api/profile-answers` answers `{ enabled: false }`, the checklist step keeps its link to the team directory, and `POST` refuses with 503 and makes no call. Nothing changes for a hire until POps is ready and the token is set.

- `POPS_PROFILE_TOKEN`: a shared secret of its own, separate from `POPS_HUB_TOKEN` and `POPS_PLAN_TOKEN` so the three rotate independently. Set it here and in POps.
- `POPS_PROFILE_URL`: optional, defaults to `https://carrara-pops.work/api/hub-profile`.

**Who is submitting** comes from the hire's signed access code, never from the form. The endpoint runs `api/welcome.js` on the code (the same way `scripts/verify-my-onboarding.js` does), so the code format is not re-implemented and neither protected file is touched. The `planKey` and name it returns are the verified ones.

**What POps needs to provide** (proposed, for Eric to adjust):

```
POST {POPS_PROFILE_URL}/{planKey}
Authorization: Bearer {POPS_PROFILE_TOKEN}
Content-Type: application/json

{
  "name": "Ada Lovelace",            // from the verified code
  "email": "...", "location": "...", "phone": "",   // phone may be empty
  "linkedin": "...",
  "answers": { "own_words": "...", "quirks": "...", "high_bar": "...", "misunderstand": "...",
               "feedback": "...", "help_others": "...", "reach_me": "...", "value_in_others": "..." }
}
```

- `200` stores the answers on the profile. A repeat `POST` for the same key replaces them (the hire can edit and resend).
- `404` or `410` means the key is retired (POps rotates it on every re-enable); the hub tells the hire to enter their newest code.
- Any other failure shows the hire a retry message, and what they typed stays in their browser.
- Codes without a `planKey` (Slack `/new-hire`, or minted before 2026-08-17) cannot be matched to a profile. The hub shows those hires a note and keeps the team directory link.

The questions and their order are in `PV_SECTIONS` in `app.js`; the photo is deliberately not part of this survey.

## Updating snapshots

- `team.json`: team roster fallback (live data comes from Slack when `SLACK_BOT_TOKEN` is set).
- `clients.json`: client roster, leads, workstreams and descriptions, exported from the Quarry Brain. A scheduled Claude Code task on Sol's machine ("refresh-hub-clients", Mondays 8:46am) re-exports it weekly and pushes; Vercel redeploys automatically. Client descriptions come from the brain's entity description field ("Legal name" notes are filtered out) — write a real description in the brain and it appears here on the next refresh.
- `codex.json`: the narrative dataset behind the per-client pages (`#/client/<slug>`): about, engagement bullets, company facts, background notes, and doc links. Keyed by canonical client name. Structured fields (status, project types, staffing) are overridden by live Notion data when the API below is enabled.
- `/api/clients`: live clients endpoint. With `NOTION_TOKEN` set it queries the Client Codex database in Notion directly (clients + people, edge-cached for an hour), so new Active clients and staffing/status changes appear on the hub automatically; narrative content still comes from `codex.json`, and domain/lead/workstreams from `clients.json`. Without the token it serves the bundled snapshots. Setup: create an internal integration at notion.so/my-integrations, open the Client Codex page in Notion and add the integration under Connections (this covers the child databases), then set `NOTION_TOKEN` in Vercel env vars and redeploy. Notion clients whose names differ from the brain's are mapped in `ALIASES` inside `api/clients.js` — extend it if a new client shows up twice under two names.
- `profiles.json`: LinkedIn links and prior-two-companies enrichment for the Team page, researched from public web search (no LinkedIn scraping). Keyed by the exact name in `team.json`. Entries carry a `confidence` field: `high` = Carrara affiliation publicly confirmed, `medium` = strong name/context match. People with no confident public match are simply absent — add them by hand as they share their links.

## Access

The hub contains internal information (team emails, client roster). Recommended: enable Vercel Deployment Protection (Standard Protection with Vercel Authentication, or a password) in Project Settings, Deployment Protection.
