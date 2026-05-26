#!/usr/bin/env bash
#
# Phase 3 / A4 — Env / config gate
# Minimal, truthful checks for CI workflows.
#
# Usage (from repo root):
#   bash scripts/release/check-env-config.sh deploy-staging
#   bash scripts/release/check-env-config.sh deploy-production
#   bash scripts/release/check-env-config.sh migrations
#   bash scripts/release/check-env-config.sh pilot-smoke
#

set -euo pipefail

MODE="${1:-}"

if [[ -z "${MODE}" ]]; then
  echo "Usage: $0 <deploy-staging|deploy-production|migrations|pilot-smoke>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

note_external_only() {
  echo "::notice::External-only config (cannot be fully verified from repo): $*"
}

check_required_env() {
  local name="$1"
  local kind="$2" # secret | public
  if [[ -z "${!name-}" ]]; then
    echo "::error::Missing required ${kind} env: ${name}"
    return 1
  fi
  return 0
}

status=0

case "${MODE}" in
  deploy-staging)
    echo "Env/config check: deploy-staging"
    # GitHub Actions exposes these via secrets → env in the workflow.
    for var in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
      if ! check_required_env "${var}" "secret"; then
        status=1
      fi
    done
    for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_APP_URL NEXT_PUBLIC_APP_ENV; do
      if ! check_required_env "${var}" "config"; then
        status=1
      fi
    done
    if ! check_required_env "PILOT_SMOKE_BEARER" "secret"; then
      status=1
    fi
    note_external_only "Cloudflare runtime vars (SYSTEM_API_KEY, CRON_SECRET and other server keys) are dashboard-managed."
    ;;

  deploy-production)
    echo "Env/config check: deploy-production"
    for var in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
      if ! check_required_env "${var}" "secret"; then
        status=1
      fi
    done
    for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_APP_URL NEXT_PUBLIC_APP_ENV; do
      if ! check_required_env "${var}" "config"; then
        status=1
      fi
    done
    if ! check_required_env "PILOT_SMOKE_BEARER" "secret"; then
      status=1
    fi
    note_external_only "Cloudflare runtime vars (SYSTEM_API_KEY, CRON_SECRET and other server keys) are dashboard-managed."
    ;;

  migrations)
    echo "Env/config check: migrations (Supabase apply)"
    for var in SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF; do
      if ! check_required_env "${var}" "secret"; then
        status=1
      fi
    done
    note_external_only "Supabase project backup/PITR settings and dashboard-side config — see docs/security/backup-restore.md"
    ;;

  pilot-smoke)
    echo "Env/config check: pilot-smoke"
    # In CI this script is not wired directly into pilot-smoke.yml; this mode is mainly for local/manual use.
    # BASE_URL is required to be meaningful when set.
    if [[ -n "${BASE_URL-}" ]]; then
      if ! [[ "${BASE_URL}" =~ ^https?:// ]]; then
        echo "::error::BASE_URL must start with http:// or https:// (current: ${BASE_URL})"
        status=1
      fi
    else
      echo "::warning::BASE_URL is empty; pilot smoke target URL must be provided by workflow or operator."
    fi
    note_external_only "JWT for smoke (PILOT_SMOKE_BEARER_* secrets) and CRON_SECRET — verified at runtime in pilot-smoke.yml, not from repo."
    ;;

  *)
    echo "::error::Unknown mode: ${MODE}" >&2
    echo "Usage: $0 <deploy-staging|deploy-production|migrations|pilot-smoke>" >&2
    exit 1
    ;;
esac

if [[ "${status}" -ne 0 ]]; then
  exit "${status}"
fi

echo "Env/config check (${MODE}) passed (within repo-visible scope)."
exit 0

