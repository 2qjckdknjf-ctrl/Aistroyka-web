#!/usr/bin/env bash
# Portable JSON helpers for smoke scripts (Apple Silicon may have non-runnable x86 jq/python in PATH).

smoke_python3() {
  if [[ -x /usr/bin/python3 ]] && /usr/bin/python3 --version &>/dev/null 2>&1; then
    /usr/bin/python3 "$@"
  else
    python3 "$@"
  fi
}

smoke_have_jq() {
  command -v jq &>/dev/null && jq -n . &>/dev/null 2>&1
}

# Read JSON from stdin; print field per limited jq-style filter (-r '.a.b // empty').
smoke_jq() {
  local filter=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -r) shift ;;
      -e) shift; filter="$1"; shift; break ;;
      *) filter="$1"; shift; break ;;
    esac
  done
  if smoke_have_jq; then
    jq -r "$filter"
    return
  fi
  smoke_python3 -c '
import json, sys
expr = sys.argv[1].replace(" // empty", "").strip()
default = ""
if " // " in expr:
    expr, default_part = expr.split(" // ", 1)
    expr = expr.strip()
    default = default_part.strip().strip('"').strip("'")
raw = sys.stdin.read()
try:
    obj = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    print(""); raise SystemExit(0)

def out(v):
    if v is None: print("")
    elif isinstance(v, (dict, list)): print(json.dumps(v))
    else: print(v)

if expr == ".data | length":
    out(len(obj.get("data") or [])); raise SystemExit(0)

path = expr.lstrip(".")
cur = obj
while path:
    if path.startswith("data["):
        idx = int(path[path.index("[")+1:path.index("]")])
        cur = (cur.get("data") if isinstance(cur, dict) else cur) or []
        cur = cur[idx] if idx < len(cur) else None
        path = path[path.index("]")+1:].lstrip(".")
        continue
    if "." in path:
        head, path = path.split(".", 1)
    else:
        head, path = path, ""
    if head == "data" and isinstance(cur, dict):
        cur = cur.get("data")
    elif isinstance(cur, dict):
        cur = cur.get(head)
    else:
        cur = None
if (cur is None or cur == "") and default:
    out(default)
else:
    out(cur)
' "$filter"
}

smoke_jq_file() {
  local filter=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -r) shift ;;
      *) filter="$1"; shift; break ;;
    esac
  done
  local file="$1"
  smoke_jq -r "$filter" <"$file"
}

smoke_assert_analysis_result() {
  local file="$1"
  if smoke_have_jq; then
    jq -e '.risk_level and .stage and (.completion_percent|type=="number")' "$file" >/dev/null
    return
  fi
  smoke_python3 -c '
import json, sys
d = json.load(open(sys.argv[1]))
ok = bool(d.get("risk_level") and d.get("stage") and isinstance(d.get("completion_percent"), (int, float)))
sys.exit(0 if ok else 1)
' "$file"
}

smoke_assert_analysis_result_full() {
  local file="$1"
  if smoke_have_jq; then
    jq -e '.risk_level and .stage and (.completion_percent|type=="number") and (.detected_issues|type=="array") and (.recommendations|type=="array")' "$file" >/dev/null
    return
  fi
  smoke_python3 -c '
import json, sys
d = json.load(open(sys.argv[1]))
ok = (
  d.get("risk_level") and d.get("stage")
  and isinstance(d.get("completion_percent"), (int, float))
  and isinstance(d.get("detected_issues"), list)
  and isinstance(d.get("recommendations"), list)
)
sys.exit(0 if ok else 1)
' "$file"
}

smoke_assert_intelligence_shape() {
  local file="$1"
  if smoke_have_jq; then
    jq -e '.projectHealthScore and .missingEvidenceInsights and .topRiskInsights and .executiveProjectSummary' "$file" >/dev/null
    return
  fi
  smoke_python3 -c '
import json, sys
d = json.load(open(sys.argv[1]))
for key in ("projectHealthScore", "missingEvidenceInsights", "topRiskInsights", "executiveProjectSummary"):
    if key not in d:
        sys.exit(1)
' "$file"
}

smoke_json_get_bool() {
  local file="$1" key="$2"
  if smoke_have_jq; then
    jq -e ".${key} == true" "$file" &>/dev/null
    return
  fi
  smoke_python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); raise SystemExit(0 if d.get(sys.argv[2]) is True else 1)' "$file" "$key"
}
