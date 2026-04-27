#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$file"
    set +a
  fi
}

load_env_file "$ROOT_DIR/.env.local"
load_env_file "$ROOT_DIR/apps/web/.env.local"
if [ -f "$ROOT_DIR/.env.e2e" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env.e2e"
  set +a
fi

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
ARTIFACT_DIR="$ROOT_DIR/docs/audit/artifacts/$TIMESTAMP"
mkdir -p "$ARTIFACT_DIR"

export AUDIT_ARTIFACT_DIR="$ARTIFACT_DIR"
export E2E_LOCALE="${E2E_LOCALE:-ru}"
export E2E_USER_EMAIL="${E2E_USER_EMAIL:-${SMOKE_EMAIL:-}}"
export E2E_USER_PASSWORD="${E2E_USER_PASSWORD:-${SMOKE_PASSWORD:-}}"

BASE_URL="${E2E_BASE_URL:-}"
SERVER_PID=""
AUDIT_EXIT_CODE=0

cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

run_step() {
  local name="$1"
  shift
  echo "==> $name"
  set +e
  "$@" 2>&1 | tee "$ARTIFACT_DIR/${name// /_}.log"
  local status="${PIPESTATUS[0]}"
  set -e
  if [ "$status" -ne 0 ]; then
    AUDIT_EXIT_CODE=1
    echo "Step failed: $name (exit $status)" | tee -a "$ARTIFACT_DIR/${name// /_}.log"
  fi
  return 0
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

require_cmd node

if command -v bun >/dev/null 2>&1; then
  PM=(bun run)
else
  PM=(npm run)
fi

run_step "button_inventory" node scripts/audit/generate_button_inventory.mjs
run_step "clean_web_build" rm -rf apps/web/.next

if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.lint ? 0 : 1)"; then
  run_step "lint" "${PM[@]}" lint
else
  echo "==> lint skipped: no root lint script" | tee "$ARTIFACT_DIR/lint.log"
fi

if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.build ? 0 : 1)"; then
  run_step "build" "${PM[@]}" build
else
  echo "==> build skipped: no root build script" | tee "$ARTIFACT_DIR/build.log"
fi

# `next dev` must not reuse a production `.next` emitted by `next build`.
run_step "clean_web_dev_build" rm -rf apps/web/.next

if [ -z "$BASE_URL" ]; then
  E2E_PORT="${E2E_PORT:-$(node scripts/audit/find_free_port.mjs 3100 3300)}"
  BASE_URL="http://127.0.0.1:$E2E_PORT"
  export E2E_BASE_URL="$BASE_URL"
  export PLAYWRIGHT_BASE_URL="$BASE_URL"
  echo "==> start_local_web"
  (cd "$ROOT_DIR/apps/web" && "${PM[@]}" dev -- -p "$E2E_PORT" > "$ARTIFACT_DIR/web_server.log" 2>&1) &
  SERVER_PID="$!"
  set +e
  node scripts/audit/wait_for_url.mjs "$BASE_URL" 90000 | tee "$ARTIFACT_DIR/start_local_web.log"
  start_status="${PIPESTATUS[0]}"
  set -e
  if [ "$start_status" -ne 0 ]; then
    AUDIT_EXIT_CODE=1
    echo "Step failed: start_local_web base URL (exit $start_status)" | tee -a "$ARTIFACT_DIR/start_local_web.log"
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Local web server exited during startup" | tee -a "$ARTIFACT_DIR/start_local_web.log"
    AUDIT_EXIT_CODE=1
  else
    set +e
    node scripts/audit/wait_for_url.mjs "$BASE_URL/$E2E_LOCALE/login?next=/dashboard" 90000 | tee -a "$ARTIFACT_DIR/start_local_web.log"
    login_status="${PIPESTATUS[0]}"
    set -e
    if [ "$login_status" -ne 0 ]; then
      AUDIT_EXIT_CODE=1
      echo "Step failed: start_local_web login URL (exit $login_status)" | tee -a "$ARTIFACT_DIR/start_local_web.log"
    fi
  fi
else
  export PLAYWRIGHT_BASE_URL="$BASE_URL"
  echo "==> using E2E_BASE_URL=$BASE_URL" | tee "$ARTIFACT_DIR/base_url.log"
fi

run_step "playwright_button_audit" node scripts/audit/run_playwright_audit.mjs
run_step "sync_e2e" node --test apps/web/tests/sync/sync.e2e.test.mjs
run_step "audit_report" node scripts/audit/write_e2e_report.mjs

echo "Audit artifacts: $ARTIFACT_DIR"
exit "$AUDIT_EXIT_CODE"
