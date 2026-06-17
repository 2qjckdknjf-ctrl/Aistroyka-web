#!/usr/bin/env bash
# Live security header smoke (staging/prod). No auth required for checked routes.
set -euo pipefail

BASE_URL="${SECURITY_HEADERS_BASE_URL:-${BASE_URL:-https://www.aistroyka.ai}}"
BASE_URL="${BASE_URL%/}"
LOCALE="${SECURITY_HEADERS_LOCALE:-en}"
FAIL=0

require_header() {
  local label="$1"
  local headers_file="$2"
  local header_name="$3"
  if ! grep -qi "^${header_name}:" "$headers_file"; then
    echo "FAIL [$label]: missing header $header_name"
    FAIL=1
    return
  fi
  echo "  OK [$label]: $header_name present"
}

forbid_header() {
  local label="$1"
  local headers_file="$2"
  local header_name="$3"
  if grep -qi "^${header_name}:" "$headers_file"; then
    echo "FAIL [$label]: unexpected header $header_name"
    FAIL=1
    return
  fi
  echo "  OK [$label]: $header_name absent (expected)"
}

check_url() {
  local label="$1"
  local url="$2"
  local profile="$3"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(curl -sS -D "$tmp" -o /dev/null -w '%{http_code}' "$url" || echo "000")"
  echo "[$label] $url → HTTP $code (profile=$profile)"
  require_header "$label" "$tmp" "x-content-type-options"
  require_header "$label" "$tmp" "referrer-policy"
  require_header "$label" "$tmp" "x-frame-options"
  require_header "$label" "$tmp" "permissions-policy"
  if [[ "$profile" == "page" ]]; then
    require_header "$label" "$tmp" "content-security-policy"
    if [[ "$BASE_URL" == https://* && "$BASE_URL" != *localhost* ]]; then
      require_header "$label" "$tmp" "strict-transport-security"
    fi
  else
    forbid_header "$label" "$tmp" "content-security-policy"
  fi
  rm -f "$tmp"
}

echo "security_headers: base=$BASE_URL"
check_url "public-home" "$BASE_URL/$LOCALE" "page"
check_url "auth-login" "$BASE_URL/$LOCALE/login" "page"
check_url "api-health" "$BASE_URL/api/v1/health" "api"
check_url "api-portal-unauth" "$BASE_URL/api/v1/portal/projects" "api"
check_url "protected-redirect" "$BASE_URL/$LOCALE/dashboard" "page"

if [[ $FAIL -ne 0 ]]; then
  echo "security_headers: FAIL"
  exit 1
fi
echo "security_headers: PASS"
