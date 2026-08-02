#!/usr/bin/env bash
# AISTROYKA QA Platform orchestrator (Phases 15–18)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.qa" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env.qa"
  set +a
fi

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
ARTIFACT_DIR="${QA_ARTIFACT_DIR:-$ROOT_DIR/docs/qa/artifacts/$TIMESTAMP}"
export QA_ARTIFACT_DIR="$ARTIFACT_DIR"
export PLAYWRIGHT_SKIP_WEB_SERVER="${PLAYWRIGHT_SKIP_WEB_SERVER:-}"

MODE="${1:-full}"
mkdir -p "$ARTIFACT_DIR"/{playwright,reports,screenshots}

echo "==> QA Platform run ($MODE)"
echo "==> Artifacts: $ARTIFACT_DIR"

QA_EXIT=0
step() {
  local name="$1"
  shift
  echo "==> $name"
  if "$@" >"$ARTIFACT_DIR/step_${name}.log" 2>&1; then
    echo 0 >"$ARTIFACT_DIR/step_${name}.code"
  else
    echo 1 >"$ARTIFACT_DIR/step_${name}.code"
    QA_EXIT=1
  fi
}

step route-discovery node scripts/qa/route-discovery.mjs
step self-audit node scripts/qa/self-audit.mjs

if [[ "$MODE" == "public" ]]; then
  step playwright-public bash -c "cd apps/web && bunx playwright test --config=playwright.qa.config.ts --project=qa-chrome tests/qa/01-public-website.spec.ts tests/qa/10-accessibility.spec.ts tests/qa/11-security.spec.ts"
elif [[ "$MODE" == "release" ]]; then
  step unit-tests bun run test
  step lint bun run lint
  step typecheck bash -c "cd apps/web && bunx tsc --noEmit"
  step release-check bun run release:check
  step playwright-release bash -c "cd apps/web && bunx playwright test --config=playwright.qa.config.ts --project=qa-chrome"
else
  step playwright-full bash -c "cd apps/web && bunx playwright test --config=playwright.qa.config.ts"
fi

step generate-reports node scripts/qa/generate-reports.mjs

ln -sfn "$ARTIFACT_DIR" "$ROOT_DIR/docs/qa/artifacts/latest" 2>/dev/null || true

echo "==> QA Platform finished (exit $QA_EXIT)"
exit "$QA_EXIT"
