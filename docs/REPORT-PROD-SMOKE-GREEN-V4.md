# Production smoke green v4 — unblock PROD 500

**Date:** 2026-03-07  
**Branch:** release/phase5-2-1  
**Worker:** aistroyka-web-production

---

## Baseline (pre-fix)

**Verification:** Tail on `aistroyka-web-production` while hitting endpoints.

| Endpoint | HTTP code | Tail evidence |
|----------|-----------|----------------|
| GET https://aistroyka.ai/api/v1/health | 500 | logs.message: `"Error: Dynamic require of \"/.next/server/middleware-manifest.json\" is not supported"` |
| POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick | 500 | Same error in logs. |

**Script version (pre-fix):** 70486b55-5510-4665-9bce-c7fbf9471df9

---

## Post-deploy verification

**Fix:** Wrangler’s bundle injects a top-level `__require` that throws on dynamic require. Patching the **built** bundle (after `wrangler deploy --dry-run --outdir .open-next/deploy`) to replace that `__require` with a stub for paths containing `"middleware"` and `"manifest"` removes the runtime error.

**Flow:** `cf:build` → `wrangler deploy --dry-run --outdir .open-next/deploy` → `node scripts/patch-bundle-require.cjs` → `OPEN_NEXT_DEPLOY=true wrangler deploy --env production --no-bundle --config wrangler.deploy.toml`

| Endpoint | HTTP code | Notes |
|----------|-----------|--------|
| GET https://aistroyka.ai/api/v1/health | **200** | `{"ok":true,"db":"ok",...}` |
| POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick | **503** | `{"ok":false,"error_code":"admin_not_configured"}` (expected until SUPABASE_SERVICE_ROLE_KEY is set) |

**Dynamic require error:** Gone. No more `"Dynamic require of \"/.next/server/middleware-manifest.json\" is not supported"` in tail.

**Version (post-fix):** 24f29b1c-5c47-4e0e-9948-4ed22bb2a335

**Forensic archive:** `archive_prod_smoke_green_v4_20260307_1234.zip` (wrangler configs, open-next.config.ts, changes.diff, commits.log, smoke/tail sanitized, HOW_TO_VERIFY.txt).

---

## Env vars (names only)

Production Worker should have:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_APP_URL
- OPENAI_API_KEY (if used)
- SUPABASE_SERVICE_ROLE_KEY (for cron-tick; set via wrangler secret)
- CRON_SECRET (if handler requires it)

---

## Smoke (pilot_launch.sh)

*(To be filled after Stage 6.)*

---

## How to verify

1. `curl -i https://aistroyka.ai/api/v1/health` → expect 200 and JSON body.
2. `curl -i -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json"` → expect 200 or 503 with JSON (not 500).
3. Tail: `cd apps/web && npx wrangler tail aistroyka-web-production --format json` (script name; may need correct account/env).
4. Re-deploy (build + patch + deploy):  
   `cd apps/web && bun run cf:build && npx wrangler deploy --env production --dry-run --outdir .open-next/deploy && node scripts/patch-bundle-require.cjs && OPEN_NEXT_DEPLOY=true npx wrangler deploy --env production --no-bundle --config wrangler.deploy.toml`
