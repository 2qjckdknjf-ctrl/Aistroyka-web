# Live Smoke Final Verification

## Inspected files

- `scripts/smoke/pilot_launch.sh`
- `apps/web/app/api/v1/health/route.ts`
- `apps/web/app/api/v1/config/route.ts`
- `apps/web/app/api/v1/admin/jobs/cron-tick/route.ts`
- `apps/web/app/api/v1/ops/metrics/route.ts`

## 2026-05-08 — Full smoke (credential-backed)

**Auth:** Password grant path — `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from operator env; values not logged).

**Commands:**

```bash
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

**Results:** Both runs **exit 0**: **PASS** — `health`, `config`, `cron-tick`, **`ops/metrics`** (counters returned; e.g. `devices_offline` non-zero allowed).

## 2026-05-08 — Unauthenticated health (sanity)

| URL | HTTP | Notes |
|-----|------|--------|
| `https://staging.aistroyka.ai/api/v1/health` | 200 | JSON `ok`, `env:"staging"`, `buildStamp` present |
| `https://staging.aistroyka.ai/api/health` | 200 | Legacy route; successor link |
| `https://aistroyka.ai/api/v1/health` | 200 | `env:"production"` |
| `https://www.aistroyka.ai/api/v1/health` | 200 | Same stamp as apex |
| `https://aistroyka.ai/api/health` | 200 | Legacy |
| `https://www.aistroyka.ai/api/health` | 200 | Legacy |

## Historical / unauthenticated script behavior

Without tenant auth, `ops/metrics` returns **401** — expected. Earlier docs that claimed production **500** on all smoke steps are **obsolete** relative to 2026-05-07/08 behavior.

## Verdict (2026-05-08)

- **Staging smoke (full script):** **PASS** (with valid smoke user + Supabase public env).
- **Production smoke (full script):** **PASS** (same; non-destructive script only).

## Remaining gaps (outside this script)

- Playwright **E2E pilot** — separate verdict in `FINAL_E2E_REPORT.md` (2026-05-08: **FAIL** subset).
- **Manual** customer-portal finance sanity — not executed as stakeholder session here.
