# STAGE 4 — Post-audit

**Date:** 2026-03-24  
**Latest (2026-03-25):** **Lite allow-list deployed** to production (Cloudflare Worker). **`GET /api/v1/projects`** with **`x-client: android_lite`** → **200** and **“STAGE4 Pilot Project”** in `data`. **`GET /api/health`** → **`buildStamp.sha7: f2201ee`**. **GitHub Actions** deploy **succeeded**; **pilot smoke secret** verification step **failed** (missing **`PILOT_SMOKE_BEARER_PRODUCTION`**). **Maestro** not re-run (no Java 17+). **STAGE 4 still OPEN** for full **device** pilot + cross-platform IDs.

## A. PILOT VALIDATION TRUTH

| Item | Detail |
|------|--------|
| **Authenticated smoke** | **PASS** |
| **Production lite GET /api/v1/projects** | **PASS** — `android_lite`, smoke JWT, **200**, pilot project present |
| **POST /api/v1/projects (lite)** | **403** — still forbidden (expected) |
| **Android Worker Maestro full contour** | **NOT RUN** this session |
| **Android Manager Maestro** | **NOT RUN** this session |
| **iOS** | **NOT RUN** |
| **Cross-platform report ID proof** | **Outstanding** |

## B. FAILURES AND FIXES

| Type | Detail |
|------|--------|
| **Failure** | Production returned **403** for lite **`GET /api/v1/projects`**. |
| **Fix** | **`checkLiteAllowList(pathname, method, xClient)`** + middleware **`request.method`**; **deploy** via **`deploy-cloudflare-prod.yml`**. |
| **Failure** | CI build: **`@/lib/entry/entry-routing`** not found. |
| **Fix** | **Committed** `apps/web/lib/entry/` (was untracked locally). |
| **Failure** | **Local** `wrangler deploy` — Worker bundle over **3 MiB** free-tier limit (local OAuth account). |
| **Mitigation** | **CI** deploy to production **succeeded** (different account / paid Workers). |
| **Failure** | **CI** job: **Verify pilot smoke secret** — secret empty. |
| **Action** | Configure **`PILOT_SMOKE_BEARER_PRODUCTION`** in GitHub **or** adjust workflow if not required. |
| **Failure** | **Maestro** — Java **17+** not on host. |
| **Action** | Install **`openjdk@17`**, set **`JAVA_HOME`**, rerun **`scripts/maestro/run_stage4_pilot.sh`**. |

## C. STAGE 4 DECISION

| Question | Answer |
|----------|--------|
| **STAGE 4 closed** | **NO** — device Maestro evidence + report IDs + review still not captured |
| **STAGE 5** | **Not revisited** |

## D. FILES

| Action | Path |
|--------|------|
| Updated | `docs/launch/STAGE4_PILOT_VALIDATION_REPORT.md`, `STAGE4_CROSS_PLATFORM_TRUTH_MATRIX.md`, `STAGE4_POST_AUDIT.md` |
| Deployed (main) | `apps/web/lib/api/lite-allow-list.ts`, `middleware.ts`, `lite-allow-list.test.ts`; `apps/web/lib/entry/*`; `scripts/smoke/seed_pilot_project.mjs` |
