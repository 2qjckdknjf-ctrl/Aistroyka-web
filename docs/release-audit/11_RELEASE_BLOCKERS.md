# Release Audit — Phase 11: Release Blocker Register

**Generated:** Release Readiness Audit  
**Policy:** must fix before pilot | must fix before beta | can fix after launch with mitigation

---

## Blocker B1: iOS Worker Lite rename incomplete

| Field | Value |
|-------|--------|
| **Blocker ID** | B1 |
| **Title** | iOS Worker Lite app rename (WorkerLite → AiStroykaWorker) incomplete |
| **Subsystem** | Mobile / iOS Worker Lite |
| **Severity** | P0 for Worker Lite pilot |
| **Evidence** | Git status: many deleted files (WorkerLiteApp, ContentView, etc.); new AiStroykaWorkerApp, entitlements; WorkerLite folder still present with mixed state. |
| **User/business impact** | Build may fail or produce wrong app; store listing and support confusion. |
| **Failure mode** | Inconsistent bundle/display name; duplicate or broken targets. |
| **Recommended fix** | Complete rename: single app target, update all references, remove dead code, run full build and device test. |
| **Estimated fix scope** | 1–2 days |
| **Release policy** | **Must fix before pilot** if Worker Lite is in pilot scope. If pilot is web + Manager only, can defer to beta. |

---

## Blocker B2: Cron secret and scheduling in production

| Field | Value |
|-------|--------|
| **Blocker ID** | B2 |
| **Title** | Cron-tick must be protected and scheduled in production |
| **Subsystem** | Jobs / automation |
| **Severity** | P0 for production |
| **Evidence** | requireCronSecretIfEnabled in cron-tick; no cron trigger in repo; Cloudflare Cron or external scheduler required. |
| **User/business impact** | Upload reconcile and job processing not run; stuck uploads and delayed AI analysis. |
| **Failure mode** | Jobs remain queued; no automatic cleanup. |
| **Recommended fix** | Set REQUIRE_CRON_SECRET=true and CRON_SECRET; configure Cloudflare Cron Triggers (or equivalent) to POST to cron-tick with secret header. |
| **Estimated fix scope** | Config + 1 hour |
| **Release policy** | **Must fix before pilot** if production deploy is used. |

---

## Blocker B3: Debug/diag routes in production

| Field | Value |
|-------|--------|
| **Blocker ID** | B3 |
| **Title** | Debug and diag routes must be disabled or strictly gated in production |
| **Subsystem** | Security / API |
| **Severity** | P1 (high risk if enabled) |
| **Evidence** | isDebugAuthAllowed / isDebugDiagAllowed: in production default false unless DEBUG_AUTH/ENABLE_DIAG_ROUTES set. If set, ALLOW_DEBUG_HOSTS restricts by host. |
| **User/business impact** | Session/cookie and Supabase connectivity info could leak if enabled. |
| **Failure mode** | Information disclosure. |
| **Recommended fix** | Ensure production env does not set ENABLE_DIAG_ROUTES or DEBUG_AUTH/DEBUG_DIAG; or set ALLOW_DEBUG_HOSTS to internal-only host. |
| **Estimated fix scope** | Config review |
| **Release policy** | **Must fix before pilot** (verification only). |

---

## Blocker B4: Required environment variables

| Field | Value |
|-------|--------|
| **Blocker ID** | B4 |
| **Title** | All required env vars must be set for target environment |
| **Subsystem** | Deployment |
| **Severity** | P0 |
| **Evidence** | getAdminClient, isOpenAIConfigured, Stripe webhook, Supabase URL/keys; missing vars cause 503 or feature failure. |
| **User/business impact** | Login, AI, billing, or jobs fail. |
| **Failure mode** | 503 or silent feature failure. |
| **Recommended fix** | Document and validate env checklist per environment; use .env.example as base. |
| **Estimated fix scope** | Documentation + validation script |
| **Release policy** | **Must fix before pilot** (checklist + validation). |

---

## Blocker B5: Storage and bucket policies (CONFIG-DEPENDENT)

| Field | Value |
|-------|--------|
| **Blocker ID** | B5 |
| **Title** | Supabase storage bucket policies must allow correct access for upload and media |
| **Subsystem** | Data / media |
| **Severity** | P1 |
| **Evidence** | Upload flow uses upload_sessions and object_path; bucket RLS/policies not in repo. |
| **User/business impact** | Upload or media load fails. |
| **Failure mode** | 403 or missing media. |
| **Recommended fix** | Audit bucket policies in Supabase; align with tenant_id and auth.uid() where applicable. |
| **Estimated fix scope** | 0.5–1 day (validation) |
| **Release policy** | **Must fix before pilot** (validate in staging/prod). |

---

## Summary

| ID | Title | Policy |
|----|--------|--------|
| B1 | iOS Worker Lite rename | Must fix before pilot (if lite in scope) |
| B2 | Cron secret + scheduling | Must fix before pilot |
| B3 | Debug/diag gating | Must fix before pilot (verify) |
| B4 | Required env vars | Must fix before pilot |
| B5 | Storage bucket policies | Must fix before pilot (validate) |

**P0 count:** 2 (B1 if lite in scope, B2). **P1 count:** 3 (B3, B4, B5).
