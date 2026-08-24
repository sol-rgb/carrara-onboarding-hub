#!/usr/bin/env bash
# Runs one command with the tokens loaded from .env.local, or from the macOS
# Keychain if there is no .env.local. Nothing prints the values.
#
#   ./scripts/with-secrets.sh node scripts/refresh-team.js
#
# Keychain setup, done once by you, in your own terminal:
#   security add-generic-password -a "$USER" -s carrara-slack-bot-token -w
#   security add-generic-password -a "$USER" -s carrara-notion-token -w
# The -w with no value makes it prompt, so the token never lands in your shell
# history the way it would after an export.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  set -a; . ./.env.local; set +a
else
  SLACK_BOT_TOKEN="$(security find-generic-password -a "$USER" -s carrara-slack-bot-token -w 2>/dev/null || true)"
  NOTION_TOKEN="$(security find-generic-password -a "$USER" -s carrara-notion-token -w 2>/dev/null || true)"
  export SLACK_BOT_TOKEN NOTION_TOKEN
fi

# Report only whether each is present, never what it is.
echo "slack token: $([ -n "${SLACK_BOT_TOKEN:-}" ] && echo present || echo missing)"
echo "notion token: $([ -n "${NOTION_TOKEN:-}" ] && echo present || echo missing)"
exec "$@"
