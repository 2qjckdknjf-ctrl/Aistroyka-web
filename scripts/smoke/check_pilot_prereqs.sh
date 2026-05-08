#!/usr/bin/env bash
# Prints environment readiness for Phase 13 live gates (no network calls).
#
# pilot_launch.sh full PASS needs one of:
#   - AUTH_HEADER="Bearer <supabase user access_token>"
#   - COOKIE="sb-...=..." (session)
#   - SMOKE_EMAIL + SMOKE_PASSWORD + (SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)
#        + (SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)
#
# e2e:pilot typically needs: E2E_EMAIL, E2E_PASSWORD, PLAYWRIGHT_BASE_URL (and optional E2E_PROJECT_ID).
#
# Usage:
#   ./scripts/smoke/check_pilot_prereqs.sh
#   ./scripts/smoke/check_pilot_prereqs.sh --strict   # exit 1 if ops/metrics auth path incomplete
set -euo pipefail

STRICT=0
if [[ "${1:-}" == "--strict" ]]; then
  STRICT=1
fi

BASE="${BASE_URL:-<unset — export BASE_URL for smoke>}"
OK_METRICS_AUTH=0
MISSING=()

have() {
  [[ -n "${!1:-}" ]]
}

echo "=== Pilot / Phase 13 prereq check ==="
echo "BASE_URL (for smoke): $BASE"
echo

if have AUTH_HEADER && [[ "${AUTH_HEADER:-}" == Bearer\ * ]]; then
  echo "[ops/metrics] AUTH_HEADER: set (Bearer …)"
  OK_METRICS_AUTH=1
elif have COOKIE && [[ -n "${COOKIE// /}" ]]; then
  echo "[ops/metrics] COOKIE: set"
  OK_METRICS_AUTH=1
else
  SUPA_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
  SUPA_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
  if have SMOKE_EMAIL && have SMOKE_PASSWORD && [[ -n "$SUPA_URL" && -n "$SUPA_KEY" ]]; then
    echo "[ops/metrics] SMOKE_EMAIL+PASSWORD + Supabase URL+anon: set (script will mint JWT)"
    OK_METRICS_AUTH=1
  else
    echo "[ops/metrics] No tenant auth path: need AUTH_HEADER, or COOKIE, or SMOKE_EMAIL+SMOKE_PASSWORD+Supabase URL+anon"
    MISSING+=("metrics_auth")
  fi
fi

echo
if have E2E_EMAIL && have E2E_PASSWORD; then
  echo "[e2e:pilot] E2E_EMAIL / E2E_PASSWORD: set"
else
  echo "[e2e:pilot] E2E_EMAIL / E2E_PASSWORD: missing (see apps/web/tests/e2e/_helpers/auth.ts, .env.pilot.example)"
  MISSING+=("e2e_auth")
fi

if have PLAYWRIGHT_BASE_URL; then
  echo "[e2e:pilot] PLAYWRIGHT_BASE_URL: $PLAYWRIGHT_BASE_URL"
else
  echo "[e2e:pilot] PLAYWRIGHT_BASE_URL: unset (default in docs: http://localhost:3000)"
fi

echo
if have SUPABASE_ACCESS_TOKEN; then
  echo "[supabase CLI] SUPABASE_ACCESS_TOKEN: set"
else
  echo "[supabase CLI] SUPABASE_ACCESS_TOKEN: missing — supabase projects list / link blocked"
  MISSING+=("supabase_cli")
fi

if [[ "$STRICT" -eq 1 && "$OK_METRICS_AUTH" -ne 1 ]]; then
  echo
  echo "FAIL (--strict): cannot complete pilot_launch.sh metrics step with current env."
  exit 1
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo
  echo "Summary: incomplete — ${MISSING[*]}. Fix env, then:"
  echo "  BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh"
  echo "  bun run --cwd apps/web e2e:pilot"
else
  echo
  echo "Summary: metrics auth + E2E creds look present; run smoke/E2E against a live app."
fi

exit 0
