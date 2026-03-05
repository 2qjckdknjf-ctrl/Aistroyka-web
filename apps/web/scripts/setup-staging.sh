#!/usr/bin/env bash
# One-shot staging setup: branch, optional DNS, optional secrets.
# Run from repo root or apps/web. Requires: git, optional CLOUDFLARE_API_TOKEN, optional .env.staging
set -e
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"
WEB="$ROOT/apps/web"

echo "=== 1. Branch develop ==="
if ! git rev-parse --verify develop >/dev/null 2>&1; then
  git branch develop
  echo "Created branch develop from current HEAD. Push with: git push -u origin develop"
else
  echo "Branch develop already exists."
fi

echo ""
echo "=== 2. DNS (staging.aistroyka.ai) ==="
if [[ -n "$CLOUDFLARE_API_TOKEN" ]]; then
  if [[ -n "$STAGING_CNAME_TARGET" ]]; then
    (cd "$WEB" && node scripts/cf-dns-setup-aistroyka.mjs) || true
  else
    echo "CLOUDFLARE_API_TOKEN set. To create CNAME staging: set STAGING_CNAME_TARGET (e.g. from Worker custom domain) and re-run."
    (cd "$WEB" && node scripts/cf-dns-setup-aistroyka.mjs) || true
  fi
else
  echo "Skip DNS (set CLOUDFLARE_API_TOKEN to run cf-dns-setup). Add custom domain staging.aistroyka.ai in Worker aistroyka-web-staging in Dashboard if needed."
fi

echo ""
echo "=== 3. Staging secrets (Worker env) ==="
if [[ -f "$WEB/.env.staging" ]] || [[ -f "$WEB/.env.staging.local" ]]; then
  (cd "$WEB" && ./scripts/set-cf-secrets.sh staging)
else
  echo "Skip secrets (create .env.staging from .env.staging.example and re-run to upload to Worker aistroyka-web-staging)."
fi

echo ""
echo "=== 4. Next steps ==="
echo "  • Push staging branch:  git push -u origin develop"
echo "  • Cloudflare Build:     Install: bun install --frozen-lockfile, Build: bun run cf:build (root dir: repo root). See docs/CLOUDFLARE-BUILD-CANONICAL.md"
echo "  • After deploy:         curl -sS https://staging.aistroyka.ai/api/v1/health | jq .env"
echo "  • Smoke:                cd apps/web && bun run smoke:staging"
