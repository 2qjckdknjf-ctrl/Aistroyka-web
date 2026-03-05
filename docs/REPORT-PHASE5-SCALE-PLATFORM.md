# Phase 5 — Maximum SaaS at Scale: Report

**Project:** AISTROYKA.AI  
**Stack:** Next.js 14 + OpenNext + Cloudflare Workers + Supabase + OpenAI  

---

## 1. Feature flags and rollout

- **Tables:** feature_flags (key, description, rollout_percent, allowlist_tenant_ids), tenant_feature_flags (tenant_id, key, enabled, variant).
- **Evaluation:** Tenant override > allowlist > percentage (hash tenant_id) > off.
- **Endpoints:** GET /api/v1/config (flags, serverTime, traceId, clientProfile); GET/POST /api/v1/admin/flags; POST /api/v1/admin/tenants/:id/flags. Audited; admin:read / admin:write.
- **ADR:** 032.

## 2. Billing and entitlements

- **Tables:** billing_customers (Stripe customer/subscription), entitlements (tier, ai_budget_usd, max_projects, max_workers, storage_limit_gb). Entitlements = source of truth; subscription.service reads from it.
- **Endpoints:** POST /api/v1/billing/checkout-session, GET /api/v1/billing/portal, POST /api/v1/billing/webhook (Stripe signature). billing:admin (owner only).
- **ADR:** 033.

## 3. SSO / SCIM plan

- **OIDC:** identity_providers, sso_sessions; getOidcProvider, saveSsoState, consumeSsoState. Login: password + OIDC for enterprise; map by email + subject.
- **SCIM:** /api/v1/scim/* returns 501 unless SCIM_ENABLED and SCIM_TOKEN. Skeleton for future provisioning.
- **Docs:** docs/SSO-SCIM-PLAN.md. ADR 034.

## 4. Multi-provider AI and circuit breaker

- **Provider interface:** invokeVision → VisionResult (providerUsed, modelUsed). OpenAI implemented; Anthropic/Gemini stubs.
- **Router:** Select by tier + circuit state; fallback on failure. Circuit breaker: ai_provider_health (state closed|open|half_open); recordSuccess/recordFailure.
- **ADR:** 035.

## 5. Event stream and analytics

- **Events table:** Append-only (tenant_id, user_id, event, ts, props). Key events: report_submit, media_finalize, job_success/fail, ai_usage, task_assign, login, export.
- **Analytics:** getProductivity, getAiRisk, getOpsKpis. Admin: GET /api/v1/admin/analytics/productivity, ai-risk, ops (range=7d|30d|90d).
- **ADR:** 036.

## 6. Experimentation readiness

- **Tables:** experiments (key, variants, active), experiment_assignments (tenant_id, user_id, experiment_key, variant). Deterministic assignment; exposure in events.
- **ADR:** 037.

## 7. Compliance readiness

- **Docs:** docs/COMPLIANCE-READINESS.md (retention, audit, RBAC, incident response, change management, secrets).
- **Endpoint:** GET /api/v1/admin/security/posture (debug_enabled_in_prod, retention_policy_days, sso_enabled, critical_alerts_last_30d).
- **ADR:** 038.

## 8. Release runbook and smoke scripts

- **Docs:** docs/RELEASE-RUNBOOK.md (rollout, rollback, incident, freeze flags).
- **Scripts:** scripts/smoke-v1.sh, smoke-mobile.sh, smoke-admin.sh. CI-friendly (BASE_URL, AUTH_HEADER).
- **ADR:** 039.

## 9. Security hardening (Phase 5.9)

- Bot/auth/upload/export: rate limits, progressive delays, MIME/size checks, tenant concurrency. Documented; extends Phase 4.8.
- **ADR:** 040.

## 10. Risk map and Phase 6 roadmap

**Risks:** Stripe/webhook key handling; SSO callback security; event volume growth; circuit breaker tuning per provider.

**Phase 6 (candidate):** Full SCIM provisioning; SAML implementation; materialized analytics views; external alerting (PagerDuty); multi-region DB.

---

## ADR index (Phase 5)

- 032 Feature flags rollout  
- 033 Billing entitlements Stripe  
- 034 SSO SCIM foundation  
- 035 Multi-provider AI circuit breaker  
- 036 Events analytics  
- 037 Experimentation A-B  
- 038 Compliance posture  
- 039 Release runbook smoke  
- 040 Security hardening Phase 5  
