#!/usr/bin/env bash
# Live security header smoke (staging/prod). No auth required for checked routes.
#
# Target resolution (exactly one source; first wins):
#   1) positional $1 if non-empty
#   2) else SECURITY_HEADERS_BASE_URL if non-empty
#   3) else BASE_URL if non-empty
#   4) else https://www.aistroyka.ai
#
# Prefer SECURITY_HEADERS_BASE_URL in CI workflows so older and newer scripts agree.
# Hosts are allowlisted (fail-closed) to prevent arbitrary SSRF targets.
#
# Usage:
#   bash scripts/smoke/security_headers.sh https://staging.aistroyka.ai
#   SECURITY_HEADERS_BASE_URL=https://aistroyka.ai bash scripts/smoke/security_headers.sh
#
# Propagation-safe retries:
#   SECURITY_HEADERS_MAX_ATTEMPTS=8
#   SECURITY_HEADERS_REQUIRE_CONSECUTIVE=2
#   SECURITY_HEADERS_RETRY_SLEEP_SEC=15
#
# Dry resolve (for tests; no network):
#   SECURITY_HEADERS_DRY_RESOLVE=1 bash scripts/smoke/security_headers.sh https://aistroyka.ai
set -euo pipefail

resolve_base_url() {
  local positional="${1:-}"
  local from_env=""
  if [[ -n "${positional}" ]]; then
    printf '%s' "$positional"
    return 0
  fi
  if [[ -n "${SECURITY_HEADERS_BASE_URL:-}" ]]; then
    printf '%s' "$SECURITY_HEADERS_BASE_URL"
    return 0
  fi
  if [[ -n "${BASE_URL:-}" ]]; then
    printf '%s' "$BASE_URL"
    return 0
  fi
  printf '%s' "https://www.aistroyka.ai"
}

is_allowed_base() {
  case "$1" in
    https://aistroyka.ai|https://www.aistroyka.ai|https://staging.aistroyka.ai)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Explicit empty positional (script "") is fail-closed; omitting $1 is allowed.
if [[ "${1+x}" == "x" && -z "${1}" ]]; then
  echo "security_headers: empty positional target fail-closed" >&2
  exit 2
fi

RAW_TARGET="$(resolve_base_url "${1:-}")"
BASE_URL="${RAW_TARGET%/}"
LOCALE="${SECURITY_HEADERS_LOCALE:-en}"
MAX_ATTEMPTS="${SECURITY_HEADERS_MAX_ATTEMPTS:-1}"
REQUIRE_CONSECUTIVE="${SECURITY_HEADERS_REQUIRE_CONSECUTIVE:-1}"
RETRY_SLEEP_SEC="${SECURITY_HEADERS_RETRY_SLEEP_SEC:-15}"

if [[ -z "$BASE_URL" ]]; then
  echo "security_headers: empty target fail-closed" >&2
  exit 2
fi
if ! is_allowed_base "$BASE_URL"; then
  echo "security_headers: disallowed target fail-closed: $BASE_URL" >&2
  exit 2
fi

if [[ "${SECURITY_HEADERS_DRY_RESOLVE:-}" == "1" ]]; then
  echo "security_headers: resolved_base=$BASE_URL"
  exit 0
fi

if ! [[ "$MAX_ATTEMPTS" =~ ^[0-9]+$ ]] || [[ "$MAX_ATTEMPTS" -lt 1 ]]; then
  echo "security_headers: SECURITY_HEADERS_MAX_ATTEMPTS must be >= 1" >&2
  exit 2
fi
if ! [[ "$REQUIRE_CONSECUTIVE" =~ ^[0-9]+$ ]] || [[ "$REQUIRE_CONSECUTIVE" -lt 1 ]]; then
  echo "security_headers: SECURITY_HEADERS_REQUIRE_CONSECUTIVE must be >= 1" >&2
  exit 2
fi
if [[ "$REQUIRE_CONSECUTIVE" -gt "$MAX_ATTEMPTS" ]]; then
  echo "security_headers: REQUIRE_CONSECUTIVE ($REQUIRE_CONSECUTIVE) > MAX_ATTEMPTS ($MAX_ATTEMPTS)" >&2
  exit 2
fi

# Case-insensitive header presence + duplicate detection (counts header lines).
header_count() {
  local headers_file="$1"
  local header_name="$2"
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
  local line
  line="$(grep -i "^${header_name}[[:space:]]*:" "$headers_file" | head -1 | tr -d '\r')"
  local value="${line#*:}"
  value="$(echo "$value" | sed 's/^[[:space:]]*//')"
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
  # Follow redirects for page/API smoke; never send credentials or auth headers.
  code="$(curl -sS -L --max-redirs 5 -D "$tmp" -o /dev/null -w '%{http_code}|%{url_effective}|%{num_redirects}' "$url" 2>/dev/null || echo "000||")"
  IFS='|' read -r code effective redirects <<<"$code"
  echo "[$label] $url → HTTP $code final=$effective redirects=${redirects:-0} (profile=$profile)"
  if [[ "$code" == "000" || "$code" -ge 500 ]]; then
    echo "FAIL [$label]: unexpected HTTP $code"
    FAIL=1
    rm -f "$tmp" "$meta"
    return
  fi
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

run_once() {
  FAIL=0
  echo "security_headers: base=$BASE_URL"
  check_url "public-home" "$BASE_URL/$LOCALE" "page"
  check_url "auth-login" "$BASE_URL/$LOCALE/login" "page"
  check_url "api-health" "$BASE_URL/api/v1/health" "api"
  check_url "api-portal-unauth" "$BASE_URL/api/v1/portal/projects" "api"
  check_url "protected-redirect" "$BASE_URL/$LOCALE/dashboard" "page"
  if [[ $FAIL -ne 0 ]]; then
    echo "security_headers: FAIL target=$BASE_URL"
    return 1
  fi
  echo "security_headers: PASS target=$BASE_URL"
  return 0
}

echo "security_headers: target=$BASE_URL max_attempts=$MAX_ATTEMPTS require_consecutive=$REQUIRE_CONSECUTIVE sleep_sec=$RETRY_SLEEP_SEC"
consecutive=0
attempt=1
while [[ "$attempt" -le "$MAX_ATTEMPTS" ]]; do
  echo "security_headers: attempt=$attempt/$MAX_ATTEMPTS consecutive=$consecutive target=$BASE_URL"
  if run_once; then
    consecutive=$((consecutive + 1))
    echo "security_headers: consecutive_pass=$consecutive/$REQUIRE_CONSECUTIVE target=$BASE_URL"
    if [[ "$consecutive" -ge "$REQUIRE_CONSECUTIVE" ]]; then
      echo "security_headers: PASS (consecutive=$consecutive) target=$BASE_URL"
      exit 0
    fi
  else
    consecutive=0
    echo "security_headers: consecutive reset to 0 after failure target=$BASE_URL"
  fi
  if [[ "$attempt" -lt "$MAX_ATTEMPTS" ]]; then
    sleep "$RETRY_SLEEP_SEC"
  fi
  attempt=$((attempt + 1))
done

echo "security_headers: FAIL (no $REQUIRE_CONSECUTIVE consecutive passes within $MAX_ATTEMPTS attempts) target=$BASE_URL"
exit 1
