#!/usr/bin/env bash
# Apply Supabase migrations to linked project. Operator-only; not run in CI.
# Requires: supabase CLI, linked project (supabase link) or SUPABASE_DB_URL.
# Usage: from repo root, bash scripts/release/apply-migrations.sh
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
WEB_DIR="$REPO_ROOT/apps/web"
cd "$WEB_DIR"
if ! command -v supabase &>/dev/null; then
  echo "ERROR: supabase CLI not found. Install: brew install supabase/tap/supabase"
  exit 1
fi
echo "Applying migrations from $WEB_DIR/supabase/migrations..."
supabase db push
echo "Migrations applied successfully."
