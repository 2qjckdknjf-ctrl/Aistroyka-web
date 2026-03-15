#!/usr/bin/env bash
# Migration sanity check: no future-dated, no duplicate timestamps, strict ordering.
# Exit 0 if sane, 1 otherwise.
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$REPO_ROOT/apps/web/supabase/migrations}"
FAIL=0

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "ERROR: migrations dir not found: $MIGRATIONS_DIR"
  exit 1
fi

# Extract timestamps, sort, check for duplicates and ordering
PREV=""
TODAY=$(date -u +%Y%m%d)
while IFS= read -r f; do
  base=$(basename "$f")
  ts="${base%%_*}"
  if [[ ! "$ts" =~ ^[0-9]{14}$ ]]; then
    echo "FAIL: invalid timestamp in $base"
    FAIL=1
    continue
  fi
  if [[ "$ts" -gt "${TODAY}235959" ]]; then
    echo "FAIL: future-dated migration $base (ts=$ts > today)"
    FAIL=1
  fi
  if [[ -n "$PREV" && "$ts" -le "$PREV" ]]; then
    echo "FAIL: out-of-order $base (ts=$ts <= prev=$PREV)"
    FAIL=1
  fi
  PREV="$ts"
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" | sort)

if [[ $FAIL -eq 1 ]]; then
  echo "Migration sanity check FAILED"
  exit 1
fi
echo "Migration sanity check PASSED ($(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" | wc -l | tr -d ' ') migrations)"
exit 0
