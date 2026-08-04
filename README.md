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

The new joiner opens the hub and pastes the code into the welcome kit popup (sticky, bottom right). The popup unlocks a kit personalized to them: their hiring manager, who to sync with in week one (the client lead from clients.json plus team defaults), their first client with links, how their team works, and country-specific onboarding notes. The kit persists in their browser via localStorage.

Codes are stateless: the survey answers travel inside the code, signed with `WELCOME_SECRET`, so there is no database. `/api/welcome` verifies and unpacks them. All kit content is editable in `welcome.json` (teams, countries, links); client facts come from `clients.json`.

One-time Slack app setup:

1. api.slack.com/apps, Create New App ("New Hires"), workspace carrarais.
2. Slash command `/new-hire`, request URL `https://<domain>/api/slack-newhire`.
3. Interactivity: on, same request URL.
4. Bot token scopes: `commands`, `chat:write`, `users:read` (plus `channels:read`, `users:read.email` if the same app powers the team index).
5. Install to workspace, invite the bot to #new-hires (channel ID C0BK7NG1PMM).
6. Vercel env vars: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `WELCOME_SECRET` (any long random string; keeps access codes forgery-proof), optional `NEW_HIRES_CHANNEL_ID`. Redeploy.

`/api/profile` uses the same token to post new joiner self-intros from the team page.

## Updating snapshots

- `team.json`: team roster fallback (live data comes from Slack when `SLACK_BOT_TOKEN` is set).
- `clients.json`: client roster, leads, workstreams and descriptions, exported from the Quarry Brain. A scheduled Claude Code task on Sol's machine ("refresh-hub-clients", Mondays 8:46am) re-exports it weekly and pushes; Vercel redeploys automatically. Client descriptions come from the brain's entity description field ("Legal name" notes are filtered out) — write a real description in the brain and it appears here on the next refresh.
- `codex.json`: per-client detail for the popups on the Clients page (status, project types, account managers, talent partners, coordination support, Notion hub links), exported from the Client Codex database in Notion. Keyed by the exact client name in `clients.json`. Snapshot, not live: re-export from Notion when accounts or staffing change.
- `profiles.json`: LinkedIn links and prior-two-companies enrichment for the Team page, researched from public web search (no LinkedIn scraping). Keyed by the exact name in `team.json`. Entries carry a `confidence` field: `high` = Carrara affiliation publicly confirmed, `medium` = strong name/context match. People with no confident public match are simply absent — add them by hand as they share their links.

## Access

The hub contains internal information (team emails, client roster). Recommended: enable Vercel Deployment Protection (Standard Protection with Vercel Authentication, or a password) in Project Settings, Deployment Protection.
