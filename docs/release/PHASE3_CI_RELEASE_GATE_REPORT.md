# Phase 3 CI Release Gate Report — AISTROYKA

**Date:** 2026-03-14

---

## 1. Workflows Touched

| Workflow | Branch | Purpose |
|----------|--------|---------|
| `.github/workflows/deploy-cloudflare-prod.yml` | main | Production deploy |
| `.github/workflows/deploy-cloudflare-staging.yml` | develop | Staging deploy |

---

## 2. Release Gate Steps (Order)

Both workflows now run, **before build**, in this order:

1. **Check required secrets** — CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
2. **Checkout**
3. **Setup Bun** (1.2.15)
4. **Install dependencies** — `bun install --frozen-lockfile`
5. **Migration sanity check** — `bash scripts/release/check-migrations.sh`
6. **Run tests** — `bun run test`
7. **Set build stamp and app env**
8. **Build** — `bun run cf:build`
9. **Verify build output**
10. **Deploy** (Cloudflare Workers)

---

## 3. What Is Enforced Now

| Check | Enforced | Failure behavior |
|-------|----------|------------------|
| Secrets present | Yes | Fail fast |
| Migration sanity (no future-dated, no duplicates, strict order) | Yes | Fail before build |
| Tests | Yes | Fail before build |
| Production build | Yes | Fail before deploy |
| Build output verification | Yes | Fail before deploy |
| Deploy | Yes | Job fails on deploy error |

---

## 4. What Still Requires Manual Approval

- **Deploy trigger:** Push to main (prod) or develop (staging) — no manual gate; deploy runs automatically on push.
- **Pilot smoke after deploy:** Not run in CI. Run manually: `BASE_URL=https://aistroyka.ai npm run smoke:pilot` (see PHASE3_PILOT_SMOKE_USAGE.md).
- **Migration apply:** Not run in CI. Migrations must be applied to Supabase separately (e.g. `supabase db push` or equivalent).
- **Rollback:** Manual; no automated rollback.

---

## 5. Artifacts and Logging

- All steps run in a single job; logs are visible in GitHub Actions.
- No secrets are logged (CLOUDFLARE_* checked for presence only).
- Post-deploy verification (prod) runs with `continue-on-error: true` so deploy success is not blocked by transient health-check failures.

---

## 6. Migration Sanity Script

- **Path:** `scripts/release/check-migrations.sh`
- **Behavior:** Validates migration filenames in `apps/web/supabase/migrations/` — no future-dated, no duplicate timestamps, strict ascending order.
- **Does not:** Apply migrations or connect to database.
