# Phase 3 Release Checklist — AISTROYKA

**Date:** 2026-03-14

---

## Pre-Release

- [ ] CI green on target branch (main for prod, develop for staging)
- [ ] Migration sanity: `bash scripts/release/check-migrations.sh` passes
- [ ] Tests pass: `bun run test`
- [ ] Build passes: `bun run cf:build`
- [ ] Env vars documented and set (see docs/ENVIRONMENT-VARIABLES.md)

---

## Migration Checks

- [ ] New migrations (if any) applied to target Supabase project
- [ ] Migration `20260307500000_project_cost_items.sql` applied if using cost features (Step 13)
- [ ] No future-dated migration filenames
- [ ] Migration order sane (check-migrations.sh)

---

## Env / Config

- [ ] NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY set for target
- [ ] CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID in GitHub Secrets (for CI deploy)
- [ ] CRON_SECRET set if REQUIRE_CRON_SECRET=true (for cron-tick)

---

## Deploy Step

- [ ] Push to main (prod) or develop (staging)
- [ ] GitHub Actions deploy job completes
- [ ] No deploy errors in logs

---

## Smoke Step

- [ ] Run: `BASE_URL=https://aistroyka.ai npm run smoke:pilot` (prod) or `BASE_URL=https://staging.aistroyka.ai npm run smoke:pilot` (staging)
- [ ] Health, cron-tick, ops/metrics pass (or skip where auth not available)
- [ ] Exit code 0

---

## Rollback Note

- No automated rollback. To rollback: revert commit, push; CI will deploy previous build. Or redeploy a prior commit manually via wrangler.

---

## Post-Release Monitoring

- [ ] /api/v1/health returns 200
- [ ] Dashboard loads for pilot tenants
- [ ] iOS Worker can reach backend (if pilot uses iOS)

---

## Scope Notes (Phase 3)

- **Android is NOT a product gate** for this release phase. Android apps are placeholder-only; do not block release on Android parity.
- **iOS depends on backend correctness**, not Android parity. Backend health, cron-tick, and ops endpoints are the pilot-critical surface.
