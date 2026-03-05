# Technical Debt Report

**Scope:** Unfinished features, temporary code, architecture shortcuts, duplication, edge cases.

---

## 1. Unfinished Features

| Item | Description |
|------|-------------|
| Worker base | GET/POST /api/v1/worker return 501. |
| Lite allow-list | x-client parsed but no enforcement of allowed paths for ios_lite/android_lite. |
| Idempotency on lite writes | idempotency_keys table and service exist; not applied to all worker/sync/media write endpoints. |
| AI governance path | Policy Engine and Provider Router not used by analyze-image route or runVisionAnalysis. |
| Multi-provider AI | Anthropic/Gemini are stubs; only OpenAI is live. |
| Push send | Push outbox and device_tokens exist; send path stubbed. |
| SCIM/SSO | Identity layer has stubs; SCIM proxy route exists. |
| Root app/ | Duplicate or legacy app directory at repo root; role unclear. |

---

## 2. Temporary / Stub Code

| Item | Location | Note |
|------|----------|------|
| 501 worker | app/api/v1/worker/route.ts | Explicit stub. |
| APNS/FCM | lib/platform/push/*.stub.ts | Push send stubbed. |
| SAML/OIDC/SCIM | lib/platform/identity/*.stub.ts, scim proxy | Identity stubs. |
| Export sinks | S3, BigQuery, Snowflake stubs | lib/platform/exports/sinks. |

---

## 3. Architecture Shortcuts

| Item | Impact |
|------|--------|
| Direct OpenAI in route | analyze-image route contains full OpenAI call, retry, normalize, usage—bypasses Provider Router and Policy Engine. |
| Direct DB in sync/bootstrap | Route queries worker_reports and upload_sessions directly instead of via a SyncService. |
| No single AIService | Two entry points (route + runVisionAnalysis) both call OpenAI; no single facade through governance. |

---

## 4. Duplicate Logic

| Item | Notes |
|------|--------|
| Health | /api/health and /api/v1/health; v1 delegates to same controller; legacy and v1 both exist. |
| analyze-image | /api/ai/analyze-image and /api/v1/ai/analyze-image (v1 re-exports). |
| Projects | /api/projects and /api/v1/projects; possible duplication with root app/. |
| Audit artifacts | Multiple audit_* and audit_*_artifacts folders with copies of components and tests. |

---

## 5. Unhandled Edge Cases

| Area | Risk |
|------|------|
| Admin client null | Some routes check getAdminClient() and return 503; others may assume admin exists. |
| Stripe optional | Billing routes may behave differently when Stripe not configured; ensure no crash. |
| Migration order | Duplicate migration numbers (e.g. 20260307400000, 20260307500000, 20260307600000) in list—verify order and idempotency. |
| Lite + projects | If lite is blocked from /api/v1/projects by policy, document; otherwise lite could access projects today. |

---

## 6. Recommendations (Priority)

1. **High:** Introduce AIService and route all AI through Policy Engine + Provider Router; remove direct OpenAI from route and runVisionAnalysis.
2. **High:** Refactor sync/bootstrap into SyncService; remove direct Supabase from route.
3. **Medium:** Enforce Lite allow-list (middleware or guard); enforce x-idempotency-key on lite write endpoints.
4. **Medium:** Resolve or remove root app/; single source of truth for routes (apps/web).
5. **Low:** Replace 501 worker with real implementation or document as intentionally unimplemented; consolidate health/analyze-image to v1-only and deprecate legacy paths.
