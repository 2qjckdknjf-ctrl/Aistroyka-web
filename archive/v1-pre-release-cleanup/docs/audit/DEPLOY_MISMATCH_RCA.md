# Deploy mismatch RCA: /api/health missing serviceRoleConfigured

**Date:** 2026-03-03  
**Symptom:** Production `GET https://aistroyka.ai/api/health` returns `buildStamp.sha7=0e363e4` but does **not** include `serviceRoleConfigured`.

---

## 1) Repo verification (local)

| Check | Result |
|-------|--------|
| **Implementation location** | `apps/web/app/api/health/route.ts` |
| **Does it return serviceRoleConfigured?** | **Yes** — in current working tree (lines 69, 76): `const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());` and `serviceRoleConfigured` in response body. |
| **Commit that introduced it** | **None.** The change was never committed. It was made during the production lockdown session (same session as commit `88e4c64` chore(security): supabase live hardening) but the health route was **not** included in that commit. Commit `88e4c64` only contains: process route, audit docs, security scan/fixes/hardened. |

**Conclusion:** The code change exists only in the **local working tree**. No commit on any branch has ever contained `serviceRoleConfigured` in the health route.

---

## 2) Deployment verification

| Item | Value |
|------|--------|
| **Deployed commit (from buildStamp.sha7)** | **0e363e4** |
| **0e363e4 message** | `docs: update PROD_GROUND_TRUTH and PROD_FINAL_STATUS with final SHA and verification` |
| **0e363e4 files changed** | `docs/PROD_GROUND_TRUTH.md`, `docs/PROD_FINAL_STATUS.md` only — no apps/web code. |
| **Current local HEAD** | 88e4c64 (chore(security): supabase live hardening) |
| **Compare** | Production is running a build from **0e363e4**. That commit does not touch `apps/web/app/api/health/route.ts`; the last commit to touch that file before the uncommitted change was **f4ed7fd** (chore(health): add buildStamp). So production has the buildStamp change but never had serviceRoleConfigured. |

**Conclusion:** Production is serving a build from an older commit (0e363e4). Even if 88e4c64 were deployed, it still would not include serviceRoleConfigured, because that change was never committed.

---

## 3) CI verification

| Check | Result |
|-------|--------|
| **Workflow** | `.github/workflows/deploy-cloudflare-prod.yml` |
| **Trigger** | `on.push.branches: [main]` |
| **Working directory** | `defaults.run.working-directory: apps/web` ✓ |
| **Build** | `npm run cf:build` (OpenNext Cloudflare) from apps/web |
| **Deploy** | `npx wrangler deploy --env production --config wrangler.toml` (apps/web) |
| **Build stamp** | `NEXT_PUBLIC_BUILD_SHA=${{ github.sha }}`, `NEXT_PUBLIC_BUILD_TIME` set in env before build |

**Conclusion:** CI correctly builds and deploys **apps/web** from the **commit pushed to main**. The commit that was pushed and triggered the deploy that produced sha7=0e363e4 was 0e363e4 (or a branch that had that SHA as latest). No bug in CI or working-directory.

---

## 4) Cloudflare routing

- **Worker name:** aistroyka-web-production (from workflow and previous audit).
- **Routes:** Not exposed by Cloudflare MCP used in this repo. In Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Triggers → Routes, confirm that **aistroyka.ai/** and **www.aistroyka.ai/** point **only** to this worker. If they do, then /api/health is served by this worker; the mismatch is purely “which commit was built,” not “wrong worker.”

**Conclusion:** Assumed correct (single production worker). If multiple workers had routes on the same domain, responses could come from an older worker; verify in Dashboard if needed.

---

## 5) Root cause (summary)

1. **Primary:** The **serviceRoleConfigured** (and doc comment) change to `apps/web/app/api/health/route.ts` was **never committed**. It existed only in the local working tree after the lockdown session.
2. **Deployed commit:** Production buildStamp **0e363e4** is a docs-only commit; the health route at that SHA is the one from **f4ed7fd** (buildStamp added), which does not include serviceRoleConfigured.
3. **CI and path:** CI builds and deploys apps/web from the commit on main; no wrong directory or branch. The missing field is entirely due to the health change never being in a commit that was pushed and deployed.

---

## 6) Fix applied

1. **Commit created:** `fix(health): expose serviceRoleConfigured in prod health`  
   After push and deploy, buildStamp.sha7 will match that commit’s SHA (first 7 characters).  
   - Adds `serviceRoleConfigured` to the health response and updates the JSDoc.  
   - File: `apps/web/app/api/health/route.ts`.  
   - RCA: `docs/audit/DEPLOY_MISMATCH_RCA.md`.

2. **Next steps (manual):**  
   - **Push to main:** `git push origin main` (push the branch that contains the new commit; if the security commit 88e4c64 was not yet pushed, push so that main has both 88e4c64 and the new health commit).  
   - **CI:** GitHub Actions will run Deploy Cloudflare (Production), build apps/web from the new commit, and deploy to aistroyka-web-production.  
   - **Verify after deploy:**  
     - `GET https://aistroyka.ai/api/health` must include **serviceRoleConfigured** (boolean).  
     - **buildStamp.sha7** must match the new commit’s SHA (first 7 chars).  
     - If buildStamp still shows 0e363e4 after a few minutes, check Actions for the latest workflow run and confirm it completed and that the deployed commit is the one with the health fix.

---

## 7) Checklist

- [x] Repo: health route in apps/web returns serviceRoleConfigured (in code).  
- [x] Introduced-in commit: N/A (was uncommitted; now fixed in new commit).  
- [x] Deployed commit: 0e363e4 (docs only) → no serviceRoleConfigured.  
- [x] CI: working-directory apps/web, deploys from main.  
- [x] Routing: single production worker (verify in Dashboard if needed).  
- [x] Fix: commit created; push and deploy required.  
- [ ] Post-push: verify /api/health includes serviceRoleConfigured and buildStamp.sha7 matches new commit.
