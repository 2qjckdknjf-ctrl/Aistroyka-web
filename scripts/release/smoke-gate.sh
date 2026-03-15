#!/usr/bin/env bash
# Post-deploy smoke gate. Exits 1 if pilot smoke fails.
# Usage: BASE_URL=https://aistroyka.ai [CRON_SECRET=...] [SMOKE_EMAIL=... SMOKE_PASSWORD=...] bash scripts/release/smoke-gate.sh
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
exec bash "$REPO_ROOT/scripts/smoke/pilot_launch.sh"
