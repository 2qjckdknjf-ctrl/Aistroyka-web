# Phase 6 Start Audit — Pilot Deployment & Observability

**Date:** 2026-03-10  
**Role:** Principal Platform Reliability Engineer / Pilot Launch Lead  
**Scope:** Backend (web API), Web dashboard, iOS Worker, iOS Manager, Android (foundation).

---

## 1. Current release readiness by surface

| Surface | Readiness | Notes |
|--------|-----------|--------|
| **Backend (Next.js API)** | **Ready** | Health, auth, tenant context, rate limiting, many v1 routes. Sync, upload, report submit, tasks, notifications implemented. Missing: consistent request_id on all responses; structured request_finished on some key routes. |
| **Web (dashboard)** | **Ready** | SSR dashboard, auth, tenant, projects, portfolio, team, AI copilot, request_id in AI flows and error page. Missing: global diagnostics page; capture x-request-id from API for support. |
| **iOS Worker** | **Ready** | Login, projects, report create/submit, sync, background upload, push. Config from Info.plist/env. Missing: diagnostics screen; x-request-id sent/captured; last error summary. |
| **iOS Manager** | **Ready** | Manager auth, tasks, reports inbox, notifications, team, settings. Settings shows API base URL only. Missing: full diagnostics (version, tenant, role, last error, request_id). |
| **Android Worker** | **Foundation** | No Kotlin/Java code found in repo; Android is placeholder or out-of-repo. **Not ready** for pilot. |
| **Android Manager** | **Foundation** | Same as Android Worker. **Not ready** for pilot. |

---

## 2. Current diagnostics available

- **Backend:** `/api/health`, `/api/v1/health`; `/api/_debug/auth` (cookie/session/traceId); `/api/diag/supabase`. No generic request_id in response headers for all /api/v1.
- **Web:** Error page shows `request_id` from URL param in dev; AI panel shows request_id in dev/staging; admin AI request-by-id explorer.
- **iOS Manager:** Settings shows API base URL only.
- **iOS Worker:** No in-app diagnostics screen.
- **Android:** N/A.

---

## 3. Logging / error visibility gaps

- **Backend:** `logStructured` and `withRequestIdAndTiming` exist but are used only on sync, upload-sessions, jobs/process, auth/login, ai/analyze-image, ops routes. **Gaps:** report submit, task assign, notifications, many v1 routes do not log request_finished or attach x-request-id.
- **Secrets:** Logger redacts token/password/secret; no raw bearer or body dumping in structured logs. **Good.**
- **Web:** No central error reporting service (e.g. Sentry) configured; error boundary and AI error banner show request_id.
- **iOS:** No crash reporting or breadcrumb SDK integrated; no last-error persistence for diagnostics.
- **Android:** N/A.

---

## 4. Release / distribution gaps

- **Environments:** dev/staging/production exist (NODE_ENV, VERCEL_ENV, BASE_URL). No single doc that states env matrix and which URL each app uses per environment.
- **iOS:** Config from Info.plist / env; no explicit TestFlight checklist or build-number strategy doc.
- **Android:** No internal testing track documented.
- **Versioning:** No written versioning/build strategy for pilot.
- **Secrets:** Server config and env validation exist; no pilot-specific secrets handling checklist.

---

## 5. Supportability gaps

- **Correlation:** Client cannot reliably get request_id from API responses (header not set on all routes); mobile apps do not send x-request-id.
- **Tenant/role in logs:** Present where withRequestIdAndTiming is used; missing elsewhere.
- **Field debugging:** Manager/Worker lack a single “Diagnostics” view (version, env, tenant, last error, request_id).
- **Incident playbook:** Runbooks exist for AI/circuit/rate-limit; no single pilot-focused playbook with severity, triage, rollback, and failure-domain checklist.

---

## 6. Top pilot risks

1. **Request correlation** — Hard to trace a user-reported issue to backend logs without consistent request_id propagation and client capture.
2. **No crash visibility** — iOS (and future Android) crashes not reported; no error aggregation.
3. **Incomplete route instrumentation** — Critical paths (report submit, task assign, auth) missing request_finished or x-request-id.
4. **No pilot-specific runbook** — Triage and rollback for pilot incidents not codified.
5. **Android not in scope** — Pilot will be web + iOS only unless Android is activated later.

---

## 7. Strict priority order for this phase

1. **Request correlation + structured logging** — Add x-request-id propagation (middleware or per-route), extend withRequestIdAndTiming to critical routes (report submit, task assign, notifications, auth), document format and client capture.
2. **Error tracking + crash visibility** — Add abstraction/hooks for backend and web; document iOS/Android path; normalized categories and severity.
3. **Diagnostics screens** — Add or refine diagnostics in iOS Manager, iOS Worker, and web (support view or settings section) with version, env, tenant, role, last error, request_id.
4. **Release channels + environment discipline** — Document dev/staging/prod, TestFlight/internal testing, versioning, release/rollback and secrets checklist.
5. **Pilot tenant readiness** — Checklist, seed/demo data, manager/worker onboarding, minimum data and success criteria.
6. **Reliability metrics + health KPIs** — Define and implement or document: crash-free, auth success, report submit, task assign, sync/upload, notifications, 5xx/4xx, p95.
7. **Incident readiness** — Severity levels, triage flow, rollback/hotfix, who checks what; failure domains (auth, tenant, report, upload, notifications, sync, review).
8. **Pilot feedback loop** — How feedback is captured, classified (bug vs UX vs feature), and mapped to tenant/user/build.
9. **QA / validation** — Cross-surface validation and Phase 6 QA report.
10. **Final report** — Executive summary and next-step recommendations.

---

*Next: Implement request correlation and structured logging (Section 2).*
