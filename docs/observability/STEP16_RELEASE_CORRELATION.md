# Step 16 — Build / Release / Environment Correlation

## 1. Goal

Strengthen correlation between operational signals and deployments so operators can answer "which build is this?" and "which environment?"

## 2. Build stamp (repo)

- **Source:** lib/config/public.ts getBuildStamp().
- **build_sha:** NEXT_PUBLIC_BUILD_SHA ?? VERCEL_GIT_COMMIT_SHA ?? GITHUB_SHA. Empty string if unset.
- **build_sha7:** First 7 characters of sha (for display and correlation).
- **build_time:** NEXT_PUBLIC_BUILD_TIME only. Set in CI at build time.
- **app_env:** NEXT_PUBLIC_APP_ENV ?? NODE_ENV (e.g. production, staging, development).

## 3. Where it is enforced in repo

- **AI telemetry (logs):** getAiReleaseCorrelation() adds build_sha7, app_env to ai_copilot_*, ai_intelligence_*, ai_vision_* log events.
- **Audit (AI runtime):** AiRuntimeAuditDetails can include build_sha7, app_env; stored in audit_logs.details.
- **Admin GET /api/v1/admin/ops/ai-runtime:** Response includes correlation: { build_sha, build_time, app_env }.
- **Step 16 addition:** Include the same correlation in GET /api/v1/ops/metrics and GET /api/v1/ops/overview (and any new diagnostics endpoint) so every operator view has release identity.

## 4. Environment identity

- **app_env** is the canonical environment label. Set NEXT_PUBLIC_APP_ENV in CI (e.g. production, staging) so it is inlined at build. NODE_ENV is fallback when not set.
- **Production detection:** Used by system route auth and health; see lib/system/system-route-auth.ts.

## 5. What is not in repo

- **Deploy platform:** Vercel/Cloudflare set VERCEL_GIT_COMMIT_SHA or equivalent. We read them; we do not push to them. Build time and SHA are documented in docs/ENVIRONMENT-VARIABLES.md and release docs.
- **Release tagging:** No automated "release version" (e.g. v1.2.3) in app code; build_sha is the release identifier.

## 6. Operator use

- When investigating an incident, open any diagnostics/ops endpoint; correlation block gives build_sha7 and build_time. Match to CI/deploy history to know which deploy is running.
- AI runtime and structured logs include build_sha7/app_env so log aggregators can filter by deployment.
