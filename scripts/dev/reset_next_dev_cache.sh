#!/usr/bin/env bash
# Reset Next.js dev cache to avoid MODULE_NOT_FOUND (e.g. ./chunks/vendor-chunks/next.js).
# Run from repo root. Then restart: cd apps/web && bun run dev
set -euo pipefail
ROOT="${1:-.}"
WEB="${ROOT}/apps/web"
echo "Resetting Next dev cache under $WEB ..."
rm -rf "$WEB/.next"
rm -rf "$WEB/node_modules/.cache"
echo "Done. Next: cd apps/web && bun run dev"
