# Report — Phase 6: Pilot Deployment & Observability

**Date:** 2026-03-10  
**Role:** Principal Platform Reliability Engineer / Pilot Launch Lead  
**Project:** AISTROYKA

---

## Executive summary

Phase 6 prepared AISTROYKA for real pilot deployment by adding observability, diagnostics, release discipline, reliability measurement, and pilot operational tooling across backend, web, and iOS. No parallel architecture or domain model changes were introduced. Backend and web build and tests pass; iOS changes are additive (diagnostics screens, Support entry point). Android remains out of scope (no app in repo).

---

## What operational readiness gaps were closed

- **Request correlation:** Critical routes (report submit, task assign, notifications, plus existing sync, upload, jobs, auth, AI, ops) now set `x-request-id` on responses and log `request_finished` with route, status, duration, tenant_id, user_id. Clients can correlate with backend logs.
- **Structured logging:** Existing `logStructured` and redaction kept; no new ad-hoc console.log. Error capture uses a single abstraction with categories and severity.
- **Error visibility:** Backend `captureException(error, context)` with normalized categories (auth, tenant_context, report_submit, upload, sync, task_assign, review_action, notification, api_5xx/4xx, unknown) and severity; documented path to wire Sentry or similar.
- **Diagnostics/support:** iOS Manager Settings shows version, build, API, client, tenant ID, role, auth state. iOS Worker has Support → Diagnostics (version, build, API, client, device id, session, sync status/last error). Web continues to surface request_id in error page and AI panel.
- **Release discipline:** Documented dev/staging/production, TestFlight and Android internal testing readiness, versioning, release and rollback checklists, secrets handling.
- **Pilot tenant readiness:** Checklist, seed/demo data approach, manager and worker onboarding checklists, minimum roles and data, pilot success criteria.
- **Reliability KPIs:** Defined and documented (crash-free, auth, report submit, task assign, sync, upload, notifications, 5xx/4xx, p95); current implementation uses request_finished and error_captured logs; next step is log aggregation and dashboards.
- **Incident readiness:** Pilot incident playbook with severity levels, triage flow, rollback/hotfix, who checks what first, and known failure domains (auth, tenant, report, upload, notifications, sync, review).
- **Pilot feedback loop:** Design for capturing feedback, classifying bugs vs UX vs incidents, prioritizing feature requests, and mapping to tenant/user/build/version.

---

## What observability was added

- **Backend:** `withRequestIdAndTiming` on report submit, task assign, notifications (and already on sync, upload-sessions, jobs, auth, AI, ops). `captureException` with categories and severity; structured `error_captured` event. No secrets in logs.
- **Web:** No new client-side SDK; error boundary and AI request_id unchanged. Documented path for optional Sentry and diagnostics page.
- **iOS:** Diagnostics views show app version, build, env, tenant/role or device/sync for field debugging without Xcode logs.

---

## What diagnostics/support tools were added

- **iOS Manager:** Settings → Account, Environment, Diagnostics (version, build, tenant ID, role from /me).
- **iOS Worker:** Home → Support → Diagnostics sheet (version, build, API, client, device id, session, sync status, last error).
- **Docs:** DIAGNOSTICS_SURFACES.md; REQUEST_CORRELATION_AND_LOGGING.md (client send/capture of request_id).

---

## What release discipline now exists

- **Docs:** RELEASE_CHANNELS_AND_ENVIRONMENTS.md (dev/staging/prod, env config, TestFlight, Android internal testing, versioning, release checklist, rollback checklist, secrets discipline).
- **No new automation:** Checklists and versioning strategy are documented; implementation is manual or existing CI.

---

## What pilot blockers remain

- **None** that block starting a pilot with web + iOS. Recommended before first pilot: run iOS builds and smoke test Settings/Support; run web smoke/E2E once. Optional: Sentry (or similar), log aggregation, and broader route instrumentation.

---

## Exact next-step recommendations

1. **Pre-pilot:** Run iOS Manager and Worker builds; open Settings and Support → Diagnostics on device/simulator. Run web smoke test (e.g. dashboard load, login).
2. **Pilot launch:** Onboard pilot tenant per PILOT_TENANT_READINESS.md; distribute TestFlight builds with correct API URL; define support channel per PILOT_FEEDBACK_LOOP.md.
3. **When needed:** Wire Sentry (or equivalent) to `captureException`; add log aggregation and dashboards for request_finished and error_captured; extend withRequestIdAndTiming to more v1 routes.
4. **Phase 7:** Focus on pilot feedback, stability, and any remaining hardening; consider Android when in scope.

---

## Reports created (docs/pilot/)

- PHASE6_START_AUDIT.md  
- REQUEST_CORRELATION_AND_LOGGING.md  
- ERROR_TRACKING_AND_CRASH_VISIBILITY.md  
- DIAGNOSTICS_SURFACES.md  
- RELEASE_CHANNELS_AND_ENVIRONMENTS.md  
- PILOT_TENANT_READINESS.md  
- RELIABILITY_METRICS_AND_KPIS.md  
- INCIDENT_RESPONSE_PLAYBOOK.md  
- PILOT_FEEDBACK_LOOP.md  
- PHASE6_QA_REPORT.md  
- REPORT-PHASE6-PILOT-DEPLOYMENT-AND-OBSERVABILITY.md (this document)
