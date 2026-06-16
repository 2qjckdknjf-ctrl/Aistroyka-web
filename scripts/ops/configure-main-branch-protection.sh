#!/usr/bin/env bash
# Configure required status checks on main (C-03 closure helper).
# Requires: GH_TOKEN or GITHUB_TOKEN with repo admin (or fine-grained: Administration write).
#
# Usage:
#   GH_TOKEN=ghp_... bash scripts/ops/configure-main-branch-protection.sh
#   GH_TOKEN=ghp_... bash scripts/ops/configure-main-branch-protection.sh --dry-run
#
# Evidence after success:
#   gh api repos/OWNER/REPO/branches/main/protection
#   Update docs/audit/DEEP_AUDIT_RISK_REGISTER.md C-03 -> closed
set -euo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "BLOCKED: set GH_TOKEN or GITHUB_TOKEN (repo admin)."
  exit 2
fi

OWNER="${GITHUB_REPOSITORY_OWNER:-2qjckdknjf-ctrl}"
REPO="${GITHUB_REPOSITORY_NAME:-Aistroyka-web}"
if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
  API_BASE="https://api.github.com/repos/${OWNER}/${REPO}"
else
  API_BASE="https://api.github.com/repos/${GITHUB_REPOSITORY}"
fi

# Job name from .github/workflows/ci-check.yml (workflow display name: CI Check).
REQUIRED_CHECK="${REQUIRED_STATUS_CHECK:-check}"

payload="$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["${REQUIRED_CHECK}"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF
)"

echo "Target: ${API_BASE}/branches/main/protection"
echo "Required status check: ${REQUIRED_CHECK}"
echo "(Override with REQUIRED_STATUS_CHECK=... if GitHub UI shows a different context name.)"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "--- dry-run payload ---"
  echo "$payload" | python3 -m json.tool
  exit 0
fi

http_code="$(curl -sS -o /tmp/bp-response.json -w '%{http_code}' \
  -X PUT "${API_BASE}/branches/main/protection" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d "$payload")"

if [[ "$http_code" == "200" ]]; then
  echo "PASS: branch protection applied (HTTP 200)."
  if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
    python3 -m json.tool /tmp/bp-response.json | head -40
  else
    head -40 /tmp/bp-response.json
  fi
  echo ""
  echo "Next: open a test PR and confirm merge waits for '${REQUIRED_CHECK}'."
  echo "Then close C-03 in docs/audit/DEEP_AUDIT_RISK_REGISTER.md with today's date."
  exit 0
fi

echo "FAIL: branch protection HTTP ${http_code}"
cat /tmp/bp-response.json
echo ""
echo "If 404/403: token lacks admin, or use GitHub UI per docs/ops/POST_MERGE_GOVERNANCE_CHECKLIST.md § A."
exit 1
