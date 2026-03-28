# Wave 3 — Post-deploy smoke report

**Date (UTC):** 2026-03-28

## Command

```bash
cd /path/to/repo
set -a && . apps/web/.env.local && set +a
BASE_URL="https://www.aistroyka.ai" bash scripts/smoke/pilot_launch.sh
```

(`AUTH_HEADER` / cookie obtained implicitly via `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase env for ops/metrics.)

## Result

| Step | Result |
|------|--------|
| Health | PASS |
| Config | PASS |
| cron-tick | PASS (no secret path) |
| ops/metrics | PASS |
| Exit code | **0** |

## BASE_URL

`https://www.aistroyka.ai`

## Notes

- Used **`www`** host to avoid apex→www redirect stripping auth on metrics (script uses `--location-trusted` where needed).
