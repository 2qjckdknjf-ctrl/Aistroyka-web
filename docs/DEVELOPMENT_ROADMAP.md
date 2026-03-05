# Development Roadmap

**Basis:** Full system state analysis. Phases are ordered by dependency and risk.

---

## Phase 1 — Stabilize backend and architecture

**Objectives:** Align with architecture guardrails; no new features.

**Systems to build/change:**

- Introduce **AIService** (or VisionService): single entry for vision analysis. Route and job handlers call only this service. Service uses Policy Engine → Provider Router (circuit breaker, fallback) → usage recording.
- Refactor **sync/bootstrap**: move all logic into SyncService.bootstrap(ctx); route only validates, gets context, calls service, returns response.
- Add **Lite allow-list**: middleware or guard that returns 403 for ios_lite/android_lite when path is not in allowed list (worker/*, sync/*, media/upload-sessions*, reports/*/analysis-status, config, devices/*, auth/*).
- Enforce **x-idempotency-key** on lite write endpoints (upload-sessions create, worker report create/add-media/submit, sync ack) using idempotency.service.

**Risks:** Refactors touch hot paths; need tests and smoke checks.

**Outcomes:** AI governance path satisfied; routes thin; lite isolation and idempotency enforced.

---

## Phase 2 — Complete SaaS core

**Objectives:** Admin and billing fully functional; deprecate legacy routes where appropriate.

**Systems to build/change:**

- **Admin routes:** Ensure requireAdmin (or equivalent) on all /api/v1/admin/*; document roles. Implement or stub remaining admin endpoints so they return consistent contract.
- **Billing:** Verify Stripe optional behavior; document and test checkout, portal, webhook.
- **Legacy vs v1:** Decide deprecation: e.g. /api/health → redirect or remove; /api/ai/analyze-image → v1 only. Add deprecation headers where needed (see existing deprecation-headers).
- **Root app/:** Remove or clearly document; ensure only apps/web is deployed.

**Risks:** Admin and billing may depend on feature flags or external config.

**Outcomes:** Single clear API surface; admin and billing ready for use.

---

## Phase 3 — AI construction brain and multi-provider

**Objectives:** Align AI with product naming; optional multi-provider.

**Systems to build/change:**

- **Construction brain / vision:** Optionally rename or group lib/ai + lib/intelligence under a single “construction brain” module for docs; or document current layout as the canonical one.
- **Multi-provider:** Implement real Anthropic and/or Gemini providers (replace stubs) if needed; wire tier/model in Provider Router; config and feature flags.
- **Policy Engine:** Ensure all AI flows (sync and async) go through policy checks (PII, allow/deny) in AIService.

**Risks:** Multi-provider adds cost and config complexity.

**Outcomes:** AI stack aligned with guardrails and product; optional fallback providers.

---

## Phase 4 — Mobile reliability

**Objectives:** Offline-first and push ready for worker apps.

**Systems to build/change:**

- **Sync:** Confirm 409 conflict behavior in changes/ack; document and test.
- **Push:** Replace push send stub with real APNS/FCM path (or document “stub” as product decision); test device register/unregister and outbox.
- **Background uploads:** Document and verify mobile create → upload → finalize flow; test on real devices if needed.

**Risks:** Push and offline behavior are platform-specific.

**Outcomes:** Sync and push production-ready for lite clients.

---

## Phase 5 — Manager dashboard and analytics

**Objectives:** Dashboard and admin analytics fully usable.

**Systems to build/change:**

- **Dashboard:** Complete any partial admin/governance/trust/system/ai UI; wire to existing v1 admin APIs.
- **Analytics:** Ensure events and admin analytics routes (ops, ai-risk, productivity) are backed by real data and migrations; document metrics.
- **Exports:** If export batches are required, complete export handler and sink wiring beyond stubs.

**Risks:** Scope can grow with product demands.

**Outcomes:** Manager and admin users can rely on dashboard and analytics.

---

## Phase 6 — Platform scale and hardening

**Objectives:** Production readiness and operations.

**Systems to build/change:**

- **Cron:** Define and document how /api/v1/jobs/process is triggered (Cloudflare cron, external scheduler, or manual); add runbook.
- **Deployment:** Add deployment dry-run to CI or docs; verify wrangler deploy and env for staging/production.
- **Migrations:** Resolve duplicate migration timestamps; establish ordering and idempotency; document rollback.
- **Observability:** Confirm traceId/tenantId/clientProfile/routeGroup/duration on all v1 routes; add any missing logging.
- **Incident and release:** Tie runbooks (e.g. incident-response, RELEASE-RUNBOOK) to CI and deployment.

**Risks:** Operational details depend on hosting and team process.

**Outcomes:** Deployments and operations repeatable and documented; ready for production traffic.

---

## Summary Table

| Phase | Focus | Key deliverables |
|-------|--------|-------------------|
| 1 | Stabilize backend | AIService, SyncService, lite allow-list, idempotency on lite |
| 2 | SaaS core | Admin/billing complete, legacy deprecation, root app/ cleanup |
| 3 | AI | Construction brain docs, multi-provider, policy in path |
| 4 | Mobile | Sync 409, push send, upload flow |
| 5 | Dashboard | Admin UI and analytics complete |
| 6 | Scale/hardening | Cron, deploy verification, migrations, observability, runbooks |
