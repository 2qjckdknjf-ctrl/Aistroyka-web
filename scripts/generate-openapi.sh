#!/usr/bin/env bash
# Release 1: OpenAPI is not a workspace package. Regenerate from the archived generator.
# Prerequisites: bun (or npm) in PATH.
# Output: docs/_archive/packages-contracts-openapi/dist/openapi.json
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/docs/_archive/packages-contracts-openapi"
if [[ ! -f "$PKG/build-openapi.ts" ]]; then
  echo "error: expected $PKG/build-openapi.ts (archive missing?)" >&2
  exit 1
fi
cd "$PKG"
bun install
bun run build
echo "OK: $PKG/dist/openapi.json"
