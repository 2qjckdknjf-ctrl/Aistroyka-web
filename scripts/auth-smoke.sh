#!/usr/bin/env bash
# Auth smoke: GET /en/login (headers), /api/health, /api/diag/supabase.
# Writes results to docs/audit/auth-smoke.<timestamp>.txt.
# Usage: ./scripts/auth-smoke.sh [BASE_URL]
# Example: ./scripts/auth-smoke.sh https://aistroyka.ai

set -e
BASE_URL="${1:-${BASE_URL:-https://aistroyka.ai}}"
BASE_URL="${BASE_URL%/}"
OUT_DIR="docs/audit"
TS=$(date -u +%Y%m%d%H%M%S)
OUT_FILE="${OUT_DIR}/auth-smoke.${TS}.txt"

mkdir -p "$OUT_DIR"
{
  echo "Auth smoke — $BASE_URL — $TS"
  echo "========================================"

  echo ""
  echo "=== GET /en/login (headers) ==="
  curl -sS -D - -o /dev/null -w "HTTP %{http_code} time_total=%{time_total}s\n" "${BASE_URL}/en/login" || true

  echo ""
  echo "=== GET /api/health ==="
  curl -sS "${BASE_URL}/api/health" || true
  echo ""

  echo ""
  echo "=== GET /api/diag/supabase ==="
  curl -sS "${BASE_URL}/api/diag/supabase" || true
  echo ""

  echo ""
  echo "========================================"
  echo "Done — $TS"
} | tee "$OUT_FILE"

echo ""
echo "Results written to $OUT_FILE"
