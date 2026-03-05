#!/usr/bin/env bash
# Upload env vars from .env.production (or .env.production.local) to Cloudflare Worker.
# Usage: ./scripts/set-cf-secrets.sh [env]
#   env: dev (default) | staging | production
# Requires: .env.production or .env.production.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, (optional) NEXT_PUBLIC_APP_URL, (optional) SUPABASE_SERVICE_ROLE_KEY

set -e
cd "$(dirname "$0")/.."

ENV="${1:-dev}"
ENV_FILE=""
if [[ "$ENV" == "staging" ]]; then
  for f in .env.staging.local .env.staging; do
    if [[ -f "$f" ]]; then
      ENV_FILE="$f"
      break
    fi
  done
fi
if [[ -z "$ENV_FILE" ]]; then
  for f in .env.production.local .env.production; do
    if [[ -f "$f" ]]; then
      ENV_FILE="$f"
      break
    fi
  done
fi
if [[ -z "$ENV_FILE" ]]; then
  if [[ "$ENV" == "staging" ]]; then
    echo "No .env.staging or .env.staging.local found. Copy .env.staging.example and fill in staging values."
  else
    echo "No .env.production or .env.production.local found. Copy .env.production.example and fill in values."
  fi
  exit 1
fi

echo "Using $ENV_FILE for Cloudflare Worker env: $ENV"

VAR_NAMES=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_APP_URL SUPABASE_SERVICE_ROLE_KEY)
WRANGLER_ENV_FLAG=""
[[ -n "$ENV" && "$ENV" != "dev" ]] && WRANGLER_ENV_FLAG="--env $ENV"

for KEY in "${VAR_NAMES[@]}"; do
  VALUE=$(grep -E "^${KEY}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | sed 's/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//' | tr -d '\r')
  if [[ -z "$VALUE" ]]; then
    echo "  Skip $KEY (empty or missing)"
    continue
  fi
  echo -n "$VALUE" | npx wrangler secret put "$KEY" $WRANGLER_ENV_FLAG
  echo "  Set $KEY"
done

case "$ENV" in
  production) echo "Done. Deploy with: npm run cf:deploy:prod" ;;
  staging)    echo "Done. Deploy with: npm run cf:deploy:staging" ;;
  *)          echo "Done. Deploy with: npm run cf:deploy" ;;
esac
