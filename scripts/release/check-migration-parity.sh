#!/usr/bin/env bash
# Read-only migration parity: local ledger sanity + optional remote list compare.
# Never applies, pushes, or repairs migrations.
#
# Exit codes:
#   0 — local contract OK; remote parity OK or skipped (no credentials)
#   1 — local contract failure or remote mismatch when remote check enabled
#   2 — missing prerequisites for requested remote check
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$REPO_ROOT/apps/web/supabase/migrations}"
REQUIRE_REMOTE="${REQUIRE_REMOTE:-0}"
PENDING_MARKER="20260725190000_rate_limit_try_increment.sql"

echo "check-migration-parity: local sanity"
bash "$REPO_ROOT/scripts/release/check-migrations.sh"

LOCAL_COUNT=$(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" | wc -l | tr -d ' ')
echo "local_migration_count=$LOCAL_COUNT"
if [[ -f "$MIGRATIONS_DIR/$PENDING_MARKER" ]]; then
  echo "local_critical_migration=$PENDING_MARKER PRESENT"
  LOCAL_HASH=$(shasum -a 256 "$MIGRATIONS_DIR/$PENDING_MARKER" | awk '{print $1}')
  echo "local_critical_sha256_prefix=${LOCAL_HASH:0:16}"
else
  echo "local_critical_migration=$PENDING_MARKER MISSING"
  exit 1
fi

# Optional remote (Supabase Management API / CLI) — read-only only.
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "remote_check=SKIPPED (SUPABASE_ACCESS_TOKEN/SUPABASE_PROJECT_REF MISSING)"
  if [[ "$REQUIRE_REMOTE" == "1" ]]; then
    echo "check-migration-parity: REQUIRE_REMOTE=1 but credentials missing"
    exit 2
  fi
  echo "Local migration contract: YES"
  echo "Remote migration parity: BLOCKED_EXTERNAL (credentials or explicit skip)"
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
  echo "remote_check=SKIPPED (supabase CLI unavailable)"
  if [[ "$REQUIRE_REMOTE" == "1" ]]; then
    exit 2
  fi
  exit 0
fi

echo "remote_check=ATTEMPT (read-only list)"
# Prefer supabase migration list --linked style via project-ref if supported.
set +e
REMOTE_OUT=$(
  npx --yes supabase migration list --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null \
    || supabase migration list --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null
)
REMOTE_EC=$?
set -e

if [[ $REMOTE_EC -ne 0 || -z "$REMOTE_OUT" ]]; then
  echo "remote_list=FAILED_OR_EMPTY"
  if [[ "$REQUIRE_REMOTE" == "1" ]]; then
    exit 2
  fi
  echo "Remote migration parity: BLOCKED_EXTERNAL"
  exit 0
fi

# Never print full remote table if huge; only check critical version presence.
if echo "$REMOTE_OUT" | grep -q "20260725190000"; then
  echo "remote_critical_version=PRESENT"
  echo "Remote migration parity: YES (critical version observed)"
else
  echo "remote_critical_version=MISSING"
  echo "Remote migration parity: NO"
  echo "pending_critical=$PENDING_MARKER"
  exit 1
fi

echo "Local migration contract: YES"
exit 0
