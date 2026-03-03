#!/usr/bin/env bash
# prod-verify.sh — Prove which build is served on aistroyka.ai vs workers.dev
#
# Usage:
#   ./scripts/prod-verify.sh [WORKERS_DEV_BASE_URL]
#
# Example:
#   ./scripts/prod-verify.sh https://aistroyka-web-production.ACCOUNT.workers.dev
#
# If WORKERS_DEV_BASE_URL is omitted, only aistroyka.ai is checked.
#
# Expected outcomes:
# - If workers.dev shows new sha but aistroyka.ai does not → routing/DNS/routes mismatch
#   (domain not pointing to aistroyka-web-production; fix routes in Cloudflare Dashboard).
# - If both show old sha → CI is not deploying the commit or wrong app is built.
# - If both show same new sha → domain is serving the latest deploy.

set -e

DOMAIN="${DOMAIN:-https://aistroyka.ai}"
WORKERS_DEV="${1:-}"

fetch_and_report() {
  local label="$1"
  local url="$2"
  echo "========== $label =========="
  echo "URL: $url"
  headers=$(curl -sS -D - -o /tmp/prod_verify_body.$$ -w "" "$url" 2>/dev/null || true)
  if [[ -z "$headers" ]]; then
    echo "  (fetch failed or empty)"
    echo ""
    return
  fi
  echo "$headers" | grep -iE "^(cf-ray|cache-status|server|content-type):" | sed 's/^/  /'
  body=$(cat /tmp/prod_verify_body.$$ 2>/dev/null || true)
  rm -f /tmp/prod_verify_body.$$
  if echo "$body" | grep -qoE "Build: [a-f0-9]{7}|Build: local"; then
    build_line=$(echo "$body" | grep -oE "Build: [a-f0-9]{7}[^<]*|Build: local[^<]*" | head -1)
    echo "  Build marker: $build_line"
  else
    echo "  Build marker: (not found in HTML)"
  fi
  echo ""
}

echo "Production build verification"
echo "Domain: $DOMAIN"
[[ -n "$WORKERS_DEV" ]] && echo "Workers.dev base: $WORKERS_DEV"
echo ""

# /dashboard often redirects to /en/dashboard
fetch_and_report "Domain /dashboard" "$DOMAIN/dashboard"
fetch_and_report "Domain /en/dashboard" "$DOMAIN/en/dashboard"

if [[ -n "$WORKERS_DEV" ]]; then
  fetch_and_report "Workers.dev /dashboard" "$WORKERS_DEV/dashboard"
  fetch_and_report "Workers.dev /en/dashboard" "$WORKERS_DEV/en/dashboard"
fi

echo "Done. Compare Build marker lines with the commit SHA from the latest GitHub Actions 'Deploy Cloudflare (Production)' run."
