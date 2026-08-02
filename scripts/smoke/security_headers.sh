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
    http://127.0.0.1:*|http://localhost:*)
      # Opt-in only for local mocked-host contract tests (never default-on).
      if [[ "${SECURITY_HEADERS_ALLOW_LOCALHOST:-}" == "1" ]]; then
        return 0
      fi
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}

# URI schemes are case-insensitive; normalize before allowlist / absolute checks.
normalize_url_scheme() {
  local url="$1"
  if [[ "$url" =~ ^([A-Za-z][A-Za-z0-9+.-]*):(.*)$ ]]; then
    local scheme rest
    scheme="$(printf '%s' "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')"
    rest="${BASH_REMATCH[2]}"
    printf '%s:%s' "$scheme" "$rest"
    return 0
  fi
  printf '%s' "$url"
}

# scheme://host[:port] from an absolute URL (path/query stripped). Host lowercased.
extract_origin() {
  local url
  url="$(normalize_url_scheme "$1")"
  if [[ "$url" =~ ^(https?://)([^/?#]+) ]]; then
    local scheme hostport
    scheme="${BASH_REMATCH[1]}"
    hostport="$(printf '%s' "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')"
    printf '%s%s' "$scheme" "$hostport"
    return 0
  fi
  return 1
}

# Redirect/final origins must stay inside the selected environment (not the global trio).
# staging → staging only; production apex↔www only; localhost mock → same origin only.
is_allowed_redirect_origin() {
  local origin="$1"
  case "$BASE_URL" in
    https://staging.aistroyka.ai)
      [[ "$origin" == "https://staging.aistroyka.ai" ]]
      ;;
    https://aistroyka.ai|https://www.aistroyka.ai)
      [[ "$origin" == "https://aistroyka.ai" || "$origin" == "https://www.aistroyka.ai" ]]
      ;;
    http://127.0.0.1:*|http://localhost:*)
      [[ "$origin" == "$BASE_URL" ]]
      ;;
    *)
      return 1
      ;;
  esac
}

is_allowed_redirect_url() {
  local raw="$1"
  local origin
  if ! origin="$(extract_origin "$raw")"; then
    return 1
  fi
  is_allowed_redirect_origin "$origin"
}

# Absolute Location targets must stay in the selected environment.
# Relative Location values are same-origin and accepted.
assert_location_allowed() {
  local label="$1"
  local headers_file="$2"
  local loc loc_norm
  loc="$(grep -i '^location[[:space:]]*:' "$headers_file" 2>/dev/null | head -1 | tr -d '\r' || true)"
  [[ -z "$loc" ]] && return 0
  loc="${loc#*:}"
  loc="$(echo "$loc" | sed 's/^[[:space:]]*//')"
  [[ -z "$loc" ]] && return 0
  loc_norm="$(normalize_url_scheme "$loc")"
  case "$loc_norm" in
    http://*|https://*)
      if ! is_allowed_redirect_url "$loc_norm"; then
        echo "FAIL [$label]: redirect Location outside selected environment ($BASE_URL): $loc"
        FAIL=1
        return 1
      fi
      ;;
    //*)
      echo "FAIL [$label]: protocol-relative redirect Location forbidden: $loc"
      FAIL=1
      return 1
      ;;
    *://*)
      # Absolute URI with non-http(s) scheme after normalization — fail closed.
      echo "FAIL [$label]: redirect Location unsupported scheme: $loc"
      FAIL=1
      return 1
      ;;
  esac
  return 0
}

# Explicit empty positional (script "") is fail-closed; omitting $1 is allowed.
if [[ "${1+x}" == "x" && -z "${1}" ]]; then
  echo "security_headers: empty positional target fail-closed" >&2
  exit 2
fi

RAW_TARGET="$(resolve_base_url "${1:-}")"
RAW_TARGET="${RAW_TARGET%/}"
# Normalize scheme/host case before allowlist (URI schemes/hosts are case-insensitive).
if BASE_URL="$(extract_origin "$RAW_TARGET")"; then
  :
else
  BASE_URL="$(normalize_url_scheme "$RAW_TARGET")"
fi
LOCALE="${SECURITY_HEADERS_LOCALE:-en}"
MAX_ATTEMPTS="${SECURITY_HEADERS_MAX_ATTEMPTS:-1}"
REQUIRE_CONSECUTIVE="${SECURITY_HEADERS_REQUIRE_CONSECUTIVE:-1}"
RETRY_SLEEP_SEC="${SECURITY_HEADERS_RETRY_SLEEP_SEC:-15}"
CONNECT_TIMEOUT_SEC="${SECURITY_HEADERS_CONNECT_TIMEOUT_SEC:-5}"
REQUEST_MAX_TIME_SEC="${SECURITY_HEADERS_REQUEST_MAX_TIME_SEC:-12}"

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
if ! [[ "$CONNECT_TIMEOUT_SEC" =~ ^[0-9]+$ ]] || [[ "$CONNECT_TIMEOUT_SEC" -lt 1 ]]; then
  echo "security_headers: SECURITY_HEADERS_CONNECT_TIMEOUT_SEC must be >= 1" >&2
  exit 2
fi
if ! [[ "$REQUEST_MAX_TIME_SEC" =~ ^[0-9]+$ ]] || [[ "$REQUEST_MAX_TIME_SEC" -lt 1 ]]; then
  echo "security_headers: SECURITY_HEADERS_REQUEST_MAX_TIME_SEC must be >= 1" >&2
  exit 2
fi
if [[ "$CONNECT_TIMEOUT_SEC" -gt "$REQUEST_MAX_TIME_SEC" ]]; then
  echo "security_headers: connect timeout ($CONNECT_TIMEOUT_SEC) exceeds request max time ($REQUEST_MAX_TIME_SEC)" >&2
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

validate_headers_file() {
  local label="$1"
  local headers_file="$2"
  local profile="$3"
  local effective_url="$4"

  require_header "$label" "$headers_file" "x-content-type-options"
  require_header "$label" "$headers_file" "referrer-policy"
  require_header "$label" "$headers_file" "x-frame-options"
  require_header "$label" "$headers_file" "permissions-policy"
  if [[ "$profile" == "page" ]]; then
    require_header "$label" "$headers_file" "content-security-policy"
    if [[ "$effective_url" == https://* && "$effective_url" != *localhost* && "$effective_url" != *127.0.0.1* ]]; then
      require_header "$label" "$headers_file" "strict-transport-security"
    fi
  else
    forbid_header "$label" "$headers_file" "content-security-policy"
  fi
}

check_url() {
  local label="$1"
  local url="$2"
  local profile="$3"
  local tmp hop_dir
  tmp="$(mktemp)"
  hop_dir="$(mktemp -d)"
  local code effective redirects curl_rc=0
  # Follow redirects for page/API smoke; never send credentials or auth headers.
  # Capture curl exit separately: a nonzero exit (e.g. max-redirs) must fail closed
  # even when -w still emitted an HTTP code from the last hop.
  # Restrict redirect protocols: production smoke is HTTPS-only; localhost mock may use HTTP.
  local -a curl_proto_redir=(--proto-redir "=https")
  if [[ "${SECURITY_HEADERS_ALLOW_LOCALHOST:-}" == "1" ]]; then
    curl_proto_redir=(--proto-redir "=http,https")
  fi
  set +e
  # Per-request deadlines keep hung origins from consuming the whole job/retry
  # budget. Defaults are sized so all advertised serial attempts fit the live
  # (three hosts / 30 min) and production (two hosts / 20 min) workflows.
  code="$(curl -sS -L --connect-timeout "$CONNECT_TIMEOUT_SEC" --max-time "$REQUEST_MAX_TIME_SEC" --max-redirs 5 "${curl_proto_redir[@]}" -D "$tmp" -o /dev/null -w '%{http_code}|%{url_effective}|%{num_redirects}' "$url" 2>/dev/null)"
  curl_rc=$?
  set -e
  if [[ -z "$code" ]]; then
    code="000||"
  fi
  IFS='|' read -r code effective redirects <<<"$code"
  echo "[$label] $url → HTTP $code final=$effective redirects=${redirects:-0} curl_rc=$curl_rc (profile=$profile)"
  if [[ "$curl_rc" -ne 0 ]]; then
    echo "FAIL [$label]: curl exit $curl_rc (fail-closed before header accept)"
    FAIL=1
    rm -rf "$tmp" "$hop_dir"
    return
  fi
  if [[ "$code" == "000" || "$code" -ge 500 ]]; then
    echo "FAIL [$label]: unexpected HTTP $code"
    FAIL=1
    rm -rf "$tmp" "$hop_dir"
    return
  fi
  if ! is_allowed_redirect_url "$effective"; then
    echo "FAIL [$label]: url_effective outside selected environment ($BASE_URL): $effective"
    FAIL=1
    rm -rf "$tmp" "$hop_dir"
    return
  fi

  # Split every non-informational response in the redirect chain (curl -D with
  # -L appends blocks). 1xx responses such as 103 Early Hints are transport
  # metadata, not redirect/final responses, and do not carry the page security
  # header contract. Validate intermediate redirect responses (3xx) plus the
  # final non-1xx response.
  local hop_count
  hop_count="$(
    awk '
      BEGIN { n=0; keep=0 }
      tolower($0) ~ /^http\// {
        status=$2 + 0
        if (status >= 100 && status < 200) {
          keep=0
          next
        }
        n++
        keep=1
        next
      }
      keep && n > 0 { print > (dir "/hop_" n ".hdr") }
      END { print n }
    ' dir="$hop_dir" "$tmp"
  )"
  if [[ -z "$hop_count" || "$hop_count" -lt 1 ]]; then
    echo "FAIL [$label]: no HTTP response headers captured"
    FAIL=1
    rm -rf "$tmp" "$hop_dir"
    return
  fi
  local hop hop_label
  for hop in $(seq 1 "$hop_count"); do
    hop_label="${label}/hop${hop}-of-${hop_count}"
    if [[ ! -s "$hop_dir/hop_${hop}.hdr" ]]; then
      echo "FAIL [$hop_label]: empty header block"
      FAIL=1
      continue
    fi
    echo "  validate [$hop_label]"
    assert_location_allowed "$hop_label" "$hop_dir/hop_${hop}.hdr" || true
    # Intermediate hops use the request origin URL for HSTS eligibility; final uses url_effective.
    if [[ "$hop" -eq "$hop_count" ]]; then
      validate_headers_file "$hop_label" "$hop_dir/hop_${hop}.hdr" "$profile" "$effective"
    else
      validate_headers_file "$hop_label" "$hop_dir/hop_${hop}.hdr" "$profile" "$url"
    fi
  done
  rm -rf "$tmp" "$hop_dir"
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

echo "security_headers: target=$BASE_URL max_attempts=$MAX_ATTEMPTS require_consecutive=$REQUIRE_CONSECUTIVE sleep_sec=$RETRY_SLEEP_SEC connect_timeout_sec=$CONNECT_TIMEOUT_SEC request_max_time_sec=$REQUEST_MAX_TIME_SEC"
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
