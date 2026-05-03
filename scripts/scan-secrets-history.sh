#!/usr/bin/env bash
#
# Non-destructive secret audit for working tree + git history.
# Prints potential findings for manual triage.
#
# Usage:
#   ./scripts/scan-secrets-history.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_content_scan() {
  local pattern="$1"
  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" . \
      --glob '!**/node_modules/**' \
      --glob '!**/.next/**' \
      --glob '!**/audit_*_artifacts/**' || true
    return 0
  fi

  # Fallback when ripgrep binary is unavailable in PATH.
  # 1) tracked files via git grep
  git grep -nE -e "$pattern" -- . ":(exclude)**/audit_*_artifacts/**" || true
  # 2) untracked files via git index (avoid recursive full-disk style scans)
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    case "$f" in
      *"/node_modules/"*|*"/.next/"*|*"/audit_"*"_artifacts/"*) continue ;;
    esac
    grep -nE -- "$pattern" "$f" || true
  done < <(git ls-files --others --exclude-standard)
}

echo "== Secret scan: working tree (tracked + untracked files) =="
echo "-- Pattern group: common API/token formats"
run_content_scan \
  "sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z\\-_]{35}|xox[baprs]-[A-Za-z0-9-]+|whsec_[A-Za-z0-9]+"

echo
echo "-- Pattern group: private key blocks and JWT-like values"
run_content_scan \
  "-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}"

echo
echo "-- Pattern group: suspicious env assignments"
run_content_scan \
  "(SUPABASE_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY|SYSTEM_API_KEY|CLOUDFLARE_API_TOKEN|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)\\s*[:=]\\s*[^\"'[:space:]]{10,}"

echo
echo "== Secret scan: git history (non-destructive commit search) =="
echo "-- Commits with JWT-like strings in diffs"
git log --all -G 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' \
  --pretty=format:'%H %ad %s' --date=short -- . || true

echo
echo "-- Commits with private key markers in diffs"
git log --all -G '-----BEGIN [A-Z ]*PRIVATE KEY-----' \
  --pretty=format:'%H %ad %s' --date=short -- . || true

echo
echo "-- Commits with suspicious secret assignment in diffs"
git log --all -G '(SUPABASE_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY|SYSTEM_API_KEY|CLOUDFLARE_API_TOKEN|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)\s*[:=]\s*["'"'"']?[^"'"'"'[:space:]]{10,}' \
  --pretty=format:'%H %ad %s' --date=short -- . || true

echo
echo "Scan complete. Review findings and rotate any exposed real secrets."
