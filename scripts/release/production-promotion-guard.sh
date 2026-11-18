#!/usr/bin/env bash
# Fail-closed gate for Deploy Cloudflare (Production) promotions.
#
# Env inputs (never print secrets; commit message is operator-controlled text only):
#   EVENT_NAME            workflow_run | workflow_dispatch | other
#   STAGING_CONCLUSION    workflow_run.conclusion (required for workflow_run)
#   STAGING_HEAD_SHA      workflow_run.head_sha (40-char hex for workflow_run)
#   COMMIT_MESSAGE        upstream commit message (optional; used for exact skip marker)
#
# Exit 0 only when promotion is allowed. Exit nonzero blocks deploy jobs that need this guard.
set -euo pipefail

EVENT_NAME="${EVENT_NAME:-}"
STAGING_CONCLUSION="${STAGING_CONCLUSION:-}"
STAGING_HEAD_SHA="${STAGING_HEAD_SHA:-}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-}"
SKIP_MARKER='[skip-staging-deploy]'

case "$EVENT_NAME" in
  workflow_dispatch)
    echo "production_promotion_guard: OK event=workflow_dispatch (manual path)"
    exit 0
    ;;
  workflow_run)
    ;;
  "")
    echo "production_promotion_guard: FAIL missing EVENT_NAME" >&2
    exit 1
    ;;
  *)
    echo "production_promotion_guard: FAIL unexpected event=${EVENT_NAME}" >&2
    exit 1
    ;;
esac

if [[ -z "$STAGING_CONCLUSION" ]]; then
  echo "production_promotion_guard: FAIL missing staging conclusion" >&2
  exit 1
fi

if [[ "$STAGING_CONCLUSION" != "success" ]]; then
  echo "production_promotion_guard: FAIL staging conclusion=${STAGING_CONCLUSION} (no production deploy)" >&2
  exit 1
fi

if [[ -z "$STAGING_HEAD_SHA" ]]; then
  echo "production_promotion_guard: FAIL missing staging head SHA" >&2
  exit 1
fi

if ! [[ "$STAGING_HEAD_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "production_promotion_guard: FAIL malformed staging head SHA" >&2
  exit 1
fi

# Exact marker only (case-sensitive substring). Near-miss strings must not match.
if [[ "$COMMIT_MESSAGE" == *"$SKIP_MARKER"* ]]; then
  echo "production_promotion_guard: FAIL upstream commit contains exact ${SKIP_MARKER} (CI-only; no production promote)" >&2
  exit 1
fi

echo "production_promotion_guard: OK promote sha=${STAGING_HEAD_SHA}"
exit 0
