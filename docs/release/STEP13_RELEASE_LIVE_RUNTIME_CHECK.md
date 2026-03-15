# Step 13 Release — Live Runtime Check

**Date:** 2025-03-14

---

## D1. Strongest realistic proof

| Check | Method | Result |
|-------|--------|--------|
| Production URL | Operator opens production domain (e.g. aistroyka.ai or Vercel prod URL) | Pending operator |
| Deployment logs | Vercel/Cloudflare dashboard — build success, commit SHA | Pending operator |
| Dashboard/cabinet | Login → project → Costs tab loads | Pending auth |
| Cost API | GET /api/v1/projects/:id/costs with auth → 200, data shape | Pending auth |
| Build stamp | If app exposes version/build hash in UI or headers | Optional |

---

## D2. Live site updated or stale

- **Before push:** Live site does not contain uncommitted Step 13 code; if production tracks a branch that hasn’t received the reconciliation commit, site is stale.
- **After push + successful production deploy:** Live site should reflect the deployment commit. Operator must confirm deployment success and commit SHA.

---

## D3. If still stale — remaining blockers

| Blocker | Action |
|---------|--------|
| Wrong branch | Set Vercel/Cloudflare production branch to the one with the reconciliation commit |
| Failed deploy | Fix build errors; redeploy |
| Cached/stale domain | Clear CDN cache or wait for TTL; confirm domain points to current deployment |
| Env/config mismatch | Ensure production env has NEXT_PUBLIC_SUPABASE_*, etc. |
| DB/runtime mismatch | Supabase state already verified; no DB blocker |
| Auth-gated verification | Run verify-cost-runtime.mjs with credentials after deploy |
