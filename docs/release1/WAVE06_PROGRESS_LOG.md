# Wave 0.6 — Progress log (append-only)

---

## 2026-03-26

### Environment

- Node: `/Users/alex/.nvm/versions/node/v24.14.0/bin/node` v24.14.0
- Repo: `/Users/alex/Projects/AISTROYKA`

### Commands

1. `npx vitest run lib/api/lite-allow-list.test.ts --maxWorkers=1` in `apps/web` → **13 passed**
2. `npm run test` in `apps/web` → **failed** initially (7 tests) — mock missing `createClientFromRequest`
3. **Fix:** `route.test.ts` + `finalize/route.test.ts` — add `createClientFromRequest` to `@/lib/supabase/server` mock
4. `npm run test` → **179 files, 1106 tests passed**
5. `bash scripts/smoke/pilot_launch.sh` → **FAIL** (localhost)
6. `BASE_URL=https://www.aistroyka.ai` + `source apps/web/.env.local` → health/config/cron **PASS**, ops/metrics **401** (no `SMOKE_EMAIL` in env)

### Assumptions

- `SMOKE_EMAIL` / `SMOKE_PASSWORD` intentionally absent or empty in sourced `.env.local` for this run.

### Blockers recorded

- **WAVE1_BLOCKED** — G9 leadership + full smoke + waivers

---

*Append below only.*
