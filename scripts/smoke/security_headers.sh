#!/usr/bin/env bash
# Live security header smoke (staging/prod). No auth required for checked routes.
#
# Usage:
#   bash scripts/smoke/security_headers.sh
#   bash scripts/smoke/security_headers.sh https://staging.aistroyka.ai
#   bash scripts/smoke/security_headers.sh https://www.aistroyka.ai
#   SECURITY_HEADERS_BASE_URL=https://aistroyka.ai bash scripts/smoke/security_headers.sh
set -euo pipefail

BASE_URL="${1:-${SECURITY_HEADERS_BASE_URL:-${BASE_URL:-https://www.aistroyka.ai}}}"
BASE_URL="${BASE_URL%/}"
LOCALE="${SECURITY_HEADERS_LOCALE:-en}"
FAIL=0

# Case-insensitive header presence + duplicate detection (counts header lines).
header_count() {
  local headers_file="$1"
  local header_name="$2"
  # Count lines that start with Header-Name: (case-insensitive)
  grep -ci "^${header_name}[[:space:]]*:" "$headers_file" 2>/dev/null || echo 0
}

require_header() {
  local label="$1"
  local headers_file="$2"
  local header_name="$3"
  local count
  count="$(header_count "$headers_file" "$header_name" | tr -d '[:space:]')"
  if [[ "$count" -lt 1 ]]; then
    echo "FAIL [$label]: missing header $header_name"
    FAIL=1
    return
  fi
  if [[ "$count" -gt 1 ]]; then
    echo "FAIL [$label]: duplicate header $header_name (count=$count)"
    FAIL=1
    return
  fi
  # Detect comma-joined multi-value duplicates in a single header line (common middleware bug).
  local line
  line="$(grep -i "^${header_name}[[:space:]]*:" "$headers_file" | head -1 | tr -d '\r')"
  local value="${line#*:}"
  value="$(echo "$value" | sed 's/^[[:space:]]*//')"
  # For x-content-type-options / x-frame-options, repeated identical tokens joined by comma are suspicious.
  case "$(echo "$header_name" | tr '[:upper:]' '[:lower:]')" in
    x-content-type-options|x-frame-options|referrer-policy)
      if echo "$value" | grep -qi ','; then
        echo "FAIL [$label]: joined/multi value for $header_name"
        FAIL=1
        return
      fi
      ;;
  esac
  echo "  OK [$label]: $header_name present (count=1)"
}

forbid_header() {
  local label="$1"
  local headers_file="$2"
  local header_name="$3"
  local count
  count="$(header_count "$headers_file" "$header_name" | tr -d '[:space:]')"
  if [[ "$count" -gt 0 ]]; then
    echo "FAIL [$label]: unexpected header $header_name (count=$count)"
    FAIL=1
    return
  fi
  echo "  OK [$label]: $header_name absent (expected)"
}

check_url() {
  local label="$1"
  local url="$2"
  local profile="$3"
  local tmp meta
  tmp="$(mktemp)"
  meta="$(mktemp)"
  local code effective redirects
  # Follow redirects but record chain; do not send credentials.
  code="$(curl -sS -L --max-redirs 5 -D "$tmp" -o /dev/null -w '%{http_code}|%{url_effective}|%{num_redirects}' "$url" 2>/dev/null || echo "000||")"
  IFS='|' read -r code effective redirects <<<"$code"
  echo "[$label] $url → HTTP $code final=$effective redirects=${redirects:-0} (profile=$profile)"
  if [[ "$code" == "000" || "$code" -ge 500 ]]; then
    echo "FAIL [$label]: unexpected HTTP $code"
    FAIL=1
    rm -f "$tmp" "$meta"
    return
  fi
  # Use final response headers only (curl -D with -L appends; take last block).
  local final_hdr
  final_hdr="$(mktemp)"
  awk 'BEGIN{n=0} tolower($0) ~ /^http\//{n++; delete b} {b[n]=b[n] $0 "\n"} END{printf "%s", b[n]}' "$tmp" >"$final_hdr"

  require_header "$label" "$final_hdr" "x-content-type-options"
  require_header "$label" "$final_hdr" "referrer-policy"
  require_header "$label" "$final_hdr" "x-frame-options"
  require_header "$label" "$final_hdr" "permissions-policy"
  if [[ "$profile" == "page" ]]; then
    require_header "$label" "$final_hdr" "content-security-policy"
    if [[ "$effective" == https://* && "$effective" != *localhost* && "$effective" != *127.0.0.1* ]]; then
      require_header "$label" "$final_hdr" "strict-transport-security"
    fi
  else
    forbid_header "$label" "$final_hdr" "content-security-policy"
  fi
  rm -f "$tmp" "$meta" "$final_hdr"
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
exit 0
