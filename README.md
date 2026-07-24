# Carrara Onboarding Hub

Multi-section onboarding hub for new joiners. Static app + two serverless functions, deployed on Vercel.

## Live data

The site works with zero configuration using bundled snapshots. Two optional env vars turn on live refresh (set them in Vercel, Project Settings, Environment Variables, then redeploy):

### Team index (Slack)

- `SLACK_BOT_TOKEN`: a bot token from a Slack app installed in the carrarais workspace, with scopes `channels:read`, `users:read`, `users:read.email`.
- `SLACK_CHANNEL_ID`: optional, defaults to `C27MYMF3K` (#g-announcements).

With the token set, `/api/team` pulls the live member list, titles and avatars from Slack (cached 1 hour). Without it, the bundled `team.json` snapshot (Jul 24, 2026) is served.

To create the Slack app: api.slack.com/apps, Create New App, add the three scopes under OAuth and Permissions, install to workspace, copy the Bot User OAuth Token.

### Branding folder (Google Drive)

- `GOOGLE_API_KEY`: a Google Cloud API key with the Drive API enabled.
- `BRAND_FOLDER_ID`: optional, defaults to the branding folder.

With the key set (and the folder shared as "anyone with the link can view"), `/api/templates` lists the folder and the site embeds each file individually. Without it, the site falls back to Google's embedded folder view iframe, which also stays in sync automatically.

### New hires bot (Slack)

`/api/slack-newhire` powers the survey bot for #new-hires. A partner types `/new-hire` in Slack, a modal asks for name, position, project types, first client, and location, and the answers post as a formatted message to #new-hires.

One-time Slack app setup:

1. api.slack.com/apps, Create New App ("New Hires"), workspace carrarais.
2. Slash command `/new-hire`, request URL `https://<domain>/api/slack-newhire`.
3. Interactivity: on, same request URL.
4. Bot token scopes: `commands`, `chat:write` (plus `channels:read`, `users:read`, `users:read.email` if the same app powers the team index).
5. Install to workspace, invite the bot to #new-hires (channel ID C0BK7NG1PMM).
6. Vercel env vars: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, optional `NEW_HIRES_CHANNEL_ID`. Redeploy.

`/api/profile` uses the same token to post new joiner self-intros from the team page.

## Updating snapshots

- `team.json`: team roster fallback.
- `clients.json`: client roster and workstreams, exported from the Quarry Brain.

## Access

The hub contains internal information (team emails, client roster). Recommended: enable Vercel Deployment Protection (Standard Protection with Vercel Authentication, or a password) in Project Settings, Deployment Protection.
