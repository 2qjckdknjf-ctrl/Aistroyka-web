#!/usr/bin/env bash
# Phase 7.7.5 — Local Supabase bootstrap: start, migrate, seed, create auth users, write .env.local.
# Requires: Docker running, Supabase CLI (brew install supabase/tap/supabase).
# Usage: from repo root, ./scripts/bootstrap_local_supabase.sh
# Then: BASE_URL=http://localhost:3000 AUTH_HEADER="Authorization: Bearer <token>" ./scripts/smoke/pilot_launch.sh

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
PILOT_TENANT_ID="a0000001-0000-4000-8000-000000000001"
PILOT_PROJECT_ID="a0000001-0000-4000-8000-000000000002"
TIMESTAMP="${TIMESTAMP:-$(date +%s)}"
SMOKE_MANAGER_EMAIL="smoke.manager+${TIMESTAMP}@example.com"
SMOKE_WORKER_EMAIL="smoke.worker+${TIMESTAMP}@example.com"
# Generate a strong password (not committed)
SMOKE_PASSWORD="${SMOKE_PASSWORD:-$(openssl rand -base64 24)}"

echo "=== Precheck ==="
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker not found. Start Docker Desktop and retry."
  exit 1
fi
if ! docker info &>/dev/null; then
  echo "ERROR: Docker daemon not running."
  exit 1
fi
if ! command -v supabase &>/dev/null; then
  echo "ERROR: Supabase CLI not found. Install: brew install supabase/tap/supabase"
  exit 1
fi

cd "$WEB_DIR"
if [[ ! -f supabase/config.toml ]]; then
  echo "Running supabase init (no config.toml found)..."
  supabase init
fi

echo "=== Starting Supabase ==="
START_OUT=$(supabase start 2>&1) || true
echo "$START_OUT" | head -80
if ! echo "$START_OUT" | grep -q "API URL"; then
  echo "WARN: supabase start may have failed or already running. Check output above."
fi

# Parse output (do not log keys)
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
DB_URL=""
while IFS= read -r line; do
  if [[ "$line" =~ API\ URL:[[:space:]]*(.+) ]]; then SUPABASE_URL="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
  if [[ "$line" =~ anon\ key:[[:space:]]*(.+) ]]; then SUPABASE_ANON_KEY="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
  if [[ "$line" =~ service_role\ key:[[:space:]]*(.+) ]]; then SUPABASE_SERVICE_ROLE_KEY="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
  if [[ "$line" =~ DB\ URL:[[:space:]]*(postgresql://.+) ]]; then DB_URL="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
done <<< "$START_OUT"

# Fallback: get from supabase status
if [[ -z "$SUPABASE_URL" ]] && command -v supabase &>/dev/null; then
  STATUS=$(supabase status 2>/dev/null || true)
  while IFS= read -r line; do
    if [[ "$line" =~ API\ URL:[[:space:]]*(.+) ]]; then SUPABASE_URL="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
    if [[ "$line" =~ anon\ key:[[:space:]]*(.+) ]]; then SUPABASE_ANON_KEY="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
    if [[ "$line" =~ service_role\ key:[[:space:]]*(.+) ]]; then SUPABASE_SERVICE_ROLE_KEY="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
    if [[ "$line" =~ DB\ URL:[[:space:]]*(postgresql://.+) ]]; then DB_URL="${BASH_REMATCH[1]%%[[:space:]]*}"; fi
  done <<< "$STATUS"
fi

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "ERROR: Could not parse Supabase URL or service_role key from supabase start/status."
  exit 1
fi

echo "=== Applying migrations (db reset) ==="
supabase db reset --no-seed 2>&1 || true

echo "=== Seeding pilot tenant and project ==="
psql "${DB_URL}" -f "$REPO_ROOT/scripts/db/seed_local_pilot.sql" 2>/dev/null || \
  supabase db execute --file "$REPO_ROOT/scripts/db/seed_local_pilot.sql" 2>/dev/null || \
  { echo "WARN: Run manually: psql \$DB_URL -f scripts/db/seed_local_pilot.sql"; }

echo "=== Creating auth users (manager + worker) ==="
MANAGER_RESP=$(curl -sS -m 15 -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d "{\"email\":\"${SMOKE_MANAGER_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\",\"email_confirm\":true}" 2>/dev/null || echo "{}")
WORKER_RESP=$(curl -sS -m 15 -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d "{\"email\":\"${SMOKE_WORKER_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\",\"email_confirm\":true}" 2>/dev/null || echo "{}")

MANAGER_ID=""
WORKER_ID=""
if command -v jq &>/dev/null; then
  MANAGER_ID=$(echo "$MANAGER_RESP" | jq -r '.id // empty')
  WORKER_ID=$(echo "$WORKER_RESP" | jq -r '.id // empty')
fi
if [[ -z "$MANAGER_ID" || -z "$WORKER_ID" ]]; then
  echo "WARN: Could not create users (maybe already exist). Export MANAGER_ID and WORKER_ID and run post-auth SQL manually."
else
  echo "=== Inserting tenant_members and worker_tasks ==="
  TODAY=$(date -u +%Y-%m-%d)
  psql "${DB_URL}" -v manager_id="$MANAGER_ID" -v worker_id="$WORKER_ID" -v pilot_tenant="$PILOT_TENANT_ID" -v pilot_project="$PILOT_PROJECT_ID" -v today="$TODAY" <<'EOSQL' 2>/dev/null || true
INSERT INTO public.tenant_members (tenant_id, user_id, role)
VALUES (:'pilot_tenant', :'manager_id', 'admin'), (:'pilot_tenant', :'worker_id', 'member')
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
UPDATE public.tenants SET user_id = :'manager_id'::uuid WHERE id = :'pilot_tenant'::uuid;
INSERT INTO public.worker_tasks (tenant_id, project_id, title, due_date, status, assigned_to)
VALUES (:'pilot_tenant'::uuid, :'pilot_project'::uuid, 'Pilot task', :'today'::date, 'pending', :'worker_id'::uuid);
EOSQL
  # If psql -v fails (e.g. no psql), use inline SQL with env subs
  if [[ $? -ne 0 ]]; then
    psql "${DB_URL}" -c "INSERT INTO public.tenant_members (tenant_id, user_id, role) VALUES ('$PILOT_TENANT_ID', '$MANAGER_ID', 'admin'), ('$PILOT_TENANT_ID', '$WORKER_ID', 'member') ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role; UPDATE public.tenants SET user_id = '$MANAGER_ID' WHERE id = '$PILOT_TENANT_ID'; INSERT INTO public.worker_tasks (tenant_id, project_id, title, due_date, status, assigned_to) VALUES ('$PILOT_TENANT_ID', '$PILOT_PROJECT_ID', 'Pilot task', '$TODAY', 'pending', '$WORKER_ID');" 2>/dev/null || true
  fi
fi

echo "=== Signing in manager for AUTH_HEADER ==="
TOKEN_RESP=$(curl -sS -m 15 -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d "{\"email\":\"${SMOKE_MANAGER_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}" 2>/dev/null || echo "{}")
ACCESS_TOKEN=""
if command -v jq &>/dev/null; then
  ACCESS_TOKEN=$(echo "$TOKEN_RESP" | jq -r '.access_token // empty')
fi

echo "=== Writing apps/web/.env.local (untracked) ==="
mkdir -p "$WEB_DIR"
cat > "$WEB_DIR/.env.local" << EOF
# Local Supabase — do not commit
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
REQUIRE_CRON_SECRET=false
EOF
echo "Wrote $WEB_DIR/.env.local"

echo ""
echo "=== Bootstrap complete ==="
echo "BASE_URL=http://localhost:3000 (or 3001 if 3000 busy)"
echo "To run smoke:"
if [[ -n "$ACCESS_TOKEN" ]]; then
  echo "  export AUTH_HEADER=\"Authorization: Bearer ${ACCESS_TOKEN}\""
  echo "  BASE_URL=http://localhost:3000 AUTH_HEADER=\"Authorization: Bearer ${ACCESS_TOKEN}\" ./scripts/smoke/pilot_launch.sh"
else
  echo "  export SMOKE_EMAIL=\"${SMOKE_MANAGER_EMAIL}\" SMOKE_PASSWORD=\"<redacted>\""
  echo "  BASE_URL=... AUTH_HEADER=... or SMOKE_EMAIL/SMOKE_PASSWORD with NEXT_PUBLIC_* set in env"
  echo "  ./scripts/smoke/pilot_launch.sh"
fi
echo "Manager email (for reference): ${SMOKE_MANAGER_EMAIL}"
echo "Worker email: ${SMOKE_WORKER_EMAIL}"
