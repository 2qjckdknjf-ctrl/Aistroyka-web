# Deploy or route mismatch RCA: /api/health missing serviceRoleConfigured

**Date:** 2026-03-03  
**Symptom:** `GET https://aistroyka.ai/api/health` returns `buildStamp.sha7=0e363e4` and **no** `serviceRoleConfigured` field.

**Goal:** Prove whether (A) wrong Cloudflare routing to a different worker/deploy or (B) code change not deployed, then fix.

---

## Step 1 — Fetch and compare

### Production (custom domain)

**URL:** `https://aistroyka.ai/api/health`

**Response (captured):**
```json
{
  "ok": true,
  "db": "ok",
  "aiConfigured": false,
  "openaiConfigured": false,
  "supabaseReachable": true,
  "buildStamp": { "sha7": "0e363e4", "buildTime": "2026-03-03 17:29" }
}
```

- **serviceRoleConfigured:** absent  
- **buildStamp.sha7:** 0e363e4  

### Workers.dev (direct worker URL)

**URL attempted:** `https://aistroyka-web-production.864f04d729c24f574a228558b40d7b82.workers.dev/api/health`  
(Account ID from Cloudflare MCP used as subdomain placeholder.)

**Result:** **502 Bad Gateway** — endpoint unreachable (wrong subdomain or workers.dev not enabled for this worker).

**Conclusion from comparison:** A direct side‑by‑side of domain vs workers.dev was **not** possible. So we cannot prove (A) vs (B) by response diff alone. We proceed with repo and deploy proof below.

---

## Step 2 — If responses differed (routing fix)

**Not applicable:** Responses could not be compared; workers.dev URL did not return 200. If in future you have a working workers.dev URL and it returns a **different** response (e.g. includes serviceRoleConfigured and a newer sha7), then:

- **Interpretation:** Custom domain would be pointing at a different worker or an older deployment.
- **Fix:** In Cloudflare Dashboard → Workers & Pages → **aistroyka-web-production** → Triggers → Routes, ensure **only** this worker is attached to:
  - `aistroyka.ai/*`
  - `www.aistroyka.ai/*`
- Remove any other worker or route that serves aistroyka.ai / www.aistroyka.ai.

---

## Step 3 — If responses match or unknown: code and deploy

### 3.1 Implementation in repo

| Check | Result |
|-------|--------|
| **File** | `apps/web/app/api/health/route.ts` |
| **serviceRoleConfigured in code?** | **Yes** — line 69: `const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());` and line 76: `serviceRoleConfigured` in the response body. |
| **Commit that contains it** | **52fb3de** — `fix(health): expose serviceRoleConfigured in prod health` (full SHA: 52fb3de554455052484d11eda021a36c99e3c615). |

So the change **exists in the repo** and is in a **commit on main**.

### 3.2 Deployed vs repo

| Item | Value |
|------|--------|
| **Production buildStamp.sha7** | **0e363e4** |
| **Commit 0e363e4** | `docs: update PROD_GROUND_TRUTH and PROD_FINAL_STATUS with final SHA and verification` (docs-only; no apps/web changes). |
| **Commit with serviceRoleConfigured** | **52fb3de** (fix(health): expose serviceRoleConfigured in prod health). |
| **Local main** | At 52fb3de, **ahead 5** of origin/main. |

So production is serving a build from **0e363e4**. The commit that adds serviceRoleConfigured (**52fb3de**) has **not** been pushed to origin/main; therefore CI has never built or deployed it.

### 3.3 Root cause

**Conclusion: (B) Code change not deployed.**

- The code change is in the repo (commit 52fb3de on local main).
- Production responds with sha7=0e363e4, which predates 52fb3de.
- Local main is ahead of origin by 5 commits — the fix (and related commits) were never pushed, so the “wrong” response is not due to routing to another worker but to **the deployed artifact being an older build**.

No routing change is required; the fix is to **deploy the current code** (push and let CI deploy).

---

## Step 4 — Fix and verify

### Fix

1. **Push main** (so that the commit that contains serviceRoleConfigured is on origin):
   ```bash
   git push origin main
   ```
2. **Wait for CI:** `.github/workflows/deploy-cloudflare-prod.yml` runs on push to main, builds apps/web, and deploys to **aistroyka-web-production**.
3. **Optional:** In Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Triggers → Routes, confirm `aistroyka.ai/*` and `www.aistroyka.ai/*` point **only** to this worker (no other worker on the same routes).

### Verify after deploy

1. **GET https://aistroyka.ai/api/health**
   - Response must include **serviceRoleConfigured** (boolean).
   - **buildStamp.sha7** must match the deployed commit (e.g. **52fb3de** or whatever the new HEAD of main is after push).
2. If workers.dev is available, call the same path there and confirm the same fields and sha7 (proving domain and worker match).

---

## Push proof (incident close)

**Executed:** `git push origin main`  
**Output:** `To github.com:2qjckdknjf-ctrl/Aistroyka-web.git   0e363e4..52fb3de  main -> main`  
**Log:** docs/audit/DEPLOY_PUSH_LOG.md  

**Result:** origin/main now contains commit **52fb3de** (and the 4 commits before it). CI "Deploy Cloudflare (Production)" is triggered on push to main.

**New production sha7 (after CI completes):** **52fb3de**.  
**Confirmation:** Run `scripts/verify-prod-health.sh`. It asserts: HTTP 200, buildStamp.sha7 ≠ 0e363e4, response includes serviceRoleConfigured, supabaseReachable === true. First run immediately after push: prod still showed 0e363e4 (deploy in progress); see docs/audit/PROD_HEALTH_VERIFICATION_20260303193258.txt. Re-run the script after the workflow completes to confirm serviceRoleConfigured is present and sha7=52fb3de.

---

## Proof summary

| Question | Proof |
|----------|--------|
| **(A) Wrong routing?** | Not proven by response diff (workers.dev unreachable). Repo and deploy evidence point to (B). If routing were wrong, we would expect aistroyka.ai to show an *older* or *different* build than the “real” worker; here, the build on aistroyka.ai (0e363e4) is simply the last **pushed** commit, so the same worker is serving the last deployed build. |
| **(B) Code not deployed?** | **Yes.** Commit 52fb3de (serviceRoleConfigured) was on local main and had not been pushed. Production sha7=0e363e4 matched a commit without the health change. **Fix applied:** main pushed (0e363e4..52fb3de); CI will deploy. After deploy, production will show sha7=52fb3de and serviceRoleConfigured present. |

**Deliverable:** This document — `docs/audit/DEPLOY_OR_ROUTE_MISMATCH_RCA.md`.
