# Release flow (staging → prod)

**Date:** 2026-03-05  
**Purpose:** Branch-based deploys and smoke checks.

---

## 1. Branches and deploys

| Branch | Triggers | Deploy | Smoke |
|--------|----------|--------|--------|
| feature/* | Optional: preview (e.g. workers.dev) | — | Optional |
| staging | Push/merge | aistroyka-web-staging | smoke:staging |
| main | Push/merge | aistroyka-web-production | smoke:prod |

---

## 2. Flow

1. **Feature work:** On feature/*. Optional: deploy to dev Worker or preview URL; no prod domains.
2. **Merge to staging:** CI runs `bun install --frozen-lockfile`, `bun run cf:build`, deploy to **aistroyka-web-staging**. Run `bun run smoke:staging` (or CI step) against https://staging.aistroyka.ai.
3. **Merge to main:** CI runs same build, deploy to **aistroyka-web-production**. Run `bun run smoke:prod` against https://aistroyka.ai. Verify www → 301 to apex, no redirect loops.

---

## 3. Smoke commands (from repo root)

- **Prod:** `bun run smoke:prod` — curls https://aistroyka.ai/api/v1/health; expects HTTP 200 or 503 and JSON with `"ok"`.
- **Staging:** `bun run smoke:staging` — curls https://staging.aistroyka.ai/api/v1/health; expects 200/503 and preferably `"env":"staging"`.

Override base URL: `SMOKE_BASE_URL=https://... bun run smoke:prod` or pass as first arg to the script when run from apps/web.

---

## 4. Rollback

- **Worker:** Dashboard → Workers & Pages → select Worker → Deployments → rollback to previous version.
- **DNS:** Restore previous records from REPORT-DNS-DOMAINS “before” snapshot.
- **Redirect rules:** Disable or delete the www → apex rule if needed.
