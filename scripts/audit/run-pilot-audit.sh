#!/usr/bin/env bash
# Pilot-grade audit: tests, build, smoke:pilot, Playwright audit suite, reports.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.pilot" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env.pilot"
  set +a
fi

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
ARTIFACT_DIR="$ROOT_DIR/docs/audit/artifacts/$TIMESTAMP"
export ARTIFACT_DIR
mkdir -p "$ARTIFACT_DIR/playwright-traces" "$ARTIFACT_DIR/screenshots" "$ARTIFACT_DIR/network-logs" "$ARTIFACT_DIR/sync-logs"

export AUDIT_ARTIFACT_DIR="$ARTIFACT_DIR"
export PLAYWRIGHT_TEST_DIR="$ARTIFACT_DIR/playwright-test-output"
export E2E_LOCALE="${E2E_LOCALE:-en}"
export E2E_USER_EMAIL="${E2E_USER_EMAIL:-${E2E_EMAIL:-}}"
export E2E_USER_PASSWORD="${E2E_USER_PASSWORD:-${E2E_PASSWORD:-}}"

echo "==> Pilot audit artifact dir: $ARTIFACT_DIR"
echo "==> bun $(bun --version 2>/dev/null || echo 'missing')"
echo "==> node $(node --version 2>/dev/null || echo 'missing')"

AUDIT_EXIT=0
mark_step() {
  local name="$1"
  local code="$2"
  echo "$code" >"$ARTIFACT_DIR/step_${name}.code"
  [[ "$code" -ne 0 ]] && AUDIT_EXIT=1 || true
}

if [[ ! -d "$ROOT_DIR/node_modules" ]] || [[ ! -d "$ROOT_DIR/apps/web/node_modules" ]]; then
  echo "==> bun install"
  (cd "$ROOT_DIR" && bun install) >"$ARTIFACT_DIR/bun_install.log" 2>&1
  mark_step install $?
else
  echo "==> bun install (skipped: node_modules present)"
  mark_step install 0
fi

echo "==> bun run test"
( cd "$ROOT_DIR" && bun run test ) >"$ARTIFACT_DIR/unit_test.log" 2>&1
mark_step test $?

echo "==> bun run build"
( cd "$ROOT_DIR" && bun run build ) >"$ARTIFACT_DIR/build.log" 2>&1
mark_step build $?

echo "==> button inventory (static)"
( cd "$ROOT_DIR" && node scripts/audit/generate_button_inventory.mjs ) >"$ARTIFACT_DIR/button_inventory.log" 2>&1
mark_step button_inventory $?

echo "==> smoke:pilot"
( cd "$ROOT_DIR" && bun run smoke:pilot ) >"$ARTIFACT_DIR/pilot_smoke.log" 2>&1
mark_step smoke_pilot $?

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
if [[ "${PLAYWRIGHT_SKIP_WEB_SERVER:-}" == "1" ]] || [[ "${CI:-}" == "true" ]]; then
  export PLAYWRIGHT_SKIP_WEB_SERVER=1
else
  unset PLAYWRIGHT_SKIP_WEB_SERVER 2>/dev/null || true
fi

echo "==> Playwright pilot suite (apps/web)"
(
  cd "$ROOT_DIR/apps/web" && \
  bunx playwright test \
    tests/e2e/dashboard-button-audit.spec.ts \
    tests/e2e/sync-contract.spec.ts \
    tests/e2e/core-flow.spec.ts \
    --config=playwright.config.ts \
    --output="$PLAYWRIGHT_TEST_DIR" \
    --reporter=list \
    --trace=retain-on-failure
) >"$ARTIFACT_DIR/playwright_pilot.log" 2>&1
mark_step playwright $?

echo "==> write pilot reports"
node "$ROOT_DIR/scripts/audit/write_pilot_reports.mjs" || true

echo "==> Pilot audit complete (exit $AUDIT_EXIT)"
exit "$AUDIT_EXIT"
