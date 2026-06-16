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
