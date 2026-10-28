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

### Access

Sign in with Google, Carrara accounts only (`middleware.js`, `api/auth/login.js`, `api/auth/google.js`). It is the same Google client as the Carrara Hub at hub.carrara.is, so the three values are copied from that Vercel project:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: the shared client. In the Google Cloud console, that client needs this site's address plus `/api/auth/google` as one more authorized redirect URI.
- `AUTH_SECRET`: signs the session cookie. Any long random string; the same value as the hub keeps the two sites alike.
- `ALLOWED_EMAILS`: optional, comma separated, for people without a carrara.is Google Workspace account.

Only verified @carrara.is Google Workspace accounts get in (the `hd` claim is carrara.is), plus `ALLOWED_EMAILS`. Sessions last 30 days.

Three ways in without Google, all deliberate:

- A hire's own link. POps mails `?code=<access code>` on day one, sometimes before the hire's carrara.is Google account exists. A valid code (the same signed format `/api/mint` and `/api/welcome` use) sets a `hub_kit` cookie and the hire browses as usual, for 30 days.
- POps and Slack: `/api/mint` (bearer token) and `/api/slack-newhire` (Slack signature) check their callers themselves and are not behind the login. The POps contract in AGENTS.md is unchanged.
- The Vercel cron that warms `/api/team`: set `CRON_SECRET` in Vercel and Vercel sends it as a bearer token; without it the cron gets a 401 and the first visitor warms the cache instead.

Until `GOOGLE_CLIENT_ID` is set the site stays open, so deploying this before the env vars changes nothing.
