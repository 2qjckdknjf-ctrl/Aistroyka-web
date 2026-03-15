# Phase 3 Release Hardening Summary — AISTROYKA

**Date:** 2026-03-14

---

## 1. What Changed

| Area | Change |
|------|--------|
| **Migration safety** | Added `scripts/release/check-migrations.sh`; no migrations renamed (none future-dated) |
| **CI release gate** | Added migration sanity check + test steps to prod and staging deploy workflows; deploy blocked if either fails |
| **Pilot smoke** | Added health check to `scripts/smoke/pilot_launch.sh`; updated `npm run smoke:pilot` to use it |
| **Docs** | Created PHASE3_MIGRATION_SAFETY_REPORT, PHASE3_CI_RELEASE_GATE_REPORT, PHASE3_PILOT_SMOKE_USAGE, PHASE3_RELEASE_CHECKLIST |

---

## 2. What Is Now Enforced

- **Migration sanity:** No future-dated migrations, no duplicate timestamps, strict ordering
- **Tests:** Must pass before build
- **Build:** Must succeed before deploy
- **Pilot smoke:** One-command script; run manually after deploy (not in CI)

---

## 3. What Remains Manual

- Pilot smoke after deploy
- Migration apply to Supabase (CI does not run `supabase db push`)
- Rollback (revert + push, or manual wrangler deploy)
- Env/config verification before release

---

## 4. Top Remaining Release Risks

1. **Migration apply not in CI** — Migrations must be applied separately; drift between code and DB possible if forgotten.
2. **Pilot smoke not a hard gate** — Post-deploy smoke is manual; a broken deploy could go unnoticed until manual check.
3. **No automated rollback** — Rollback requires manual revert or wrangler deploy.
4. **Secrets/config** — Env vars and CRON_SECRET must be correct in production; no automated validation.

---

## 5. Validation Performed (2026-03-14)

- `bun install --frozen-lockfile` — OK
- `bash scripts/release/check-migrations.sh` — PASSED (47 migrations)
- `bun run test` — 371 tests passed
- `bun run cf:build` — OK
- `bash scripts/smoke/pilot_launch.sh` (localhost) — Expected fail (no server); script exits 1 correctly
