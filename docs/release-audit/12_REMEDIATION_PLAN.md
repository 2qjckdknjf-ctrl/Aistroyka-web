# Release Audit — Phase 13: Remediation Plan

**Generated:** Release Readiness Audit

---

## PHASE A — P0 stabilization before any pilot

| # | System | Why | Dependencies | Expected result | Validation |
|---|--------|-----|-------------|-----------------|------------|
| A1 | Cron | Jobs and upload reconcile must run | None | cron-tick called on schedule with CRON_SECRET | Health + manual job run |
| A2 | Env and debug | Avoid 503 and info leak | None | All required env set; debug/diag off in prod | Env checklist; isDebugAuthAllowed false |
| A3 | Storage | Upload and media must work | Supabase | Bucket policies allow tenant-scoped access | Upload + load test in staging |
| A4 | iOS Worker Lite (if in scope) | Build and identity | None | Single app target; rename complete | Build; device smoke |

---

## PHASE B — Pilot readiness hardening

| # | System | Why | Dependencies | Expected result | Validation |
|---|--------|-----|-------------|-----------------|------------|
| B1 | Smoke and health | Detect regressions and outages | A1–A3 | Smoke script green; health monitored | CI or daily smoke |
| B2 | Mobile crash visibility | Triage field issues | None | Crashes reported and symbolicated | Sentry or equivalent |
| B3 | Runbooks | Fast incident response | None | Doc: rollback, cron, jobs, env | Review with ops |
| B4 | Manager app prod auth | Token refresh and re-auth | None | Manager works after resume and expiry | Manual test |

---

## PHASE C — Beta readiness

| # | System | Why | Dependencies | Expected result | Validation |
|---|--------|-----|-------------|-----------------|------------|
| C1 | E2E in CI | Catch UI/API regressions | Staging env | Playwright runs on main/PR | Green E2E |
| C2 | Legacy route alignment | Consistency and security | None | Legacy routes documented or migrated to v1 | Audit pass |
| C3 | Webhook idempotency | Safe Stripe retries | None | Duplicate events ignored | Test retry |
| C4 | Localization audit | No missing keys in UI | None | All user-facing strings translated | i18n report |

---

## PHASE D — Production hardening

| # | System | Why | Dependencies | Expected result | Validation |
|---|--------|-----|-------------|-----------------|------------|
| D1 | Alerting | Proactive incident detection | Log aggregation | Alerts on 5xx, cron failure, SLO | Alert runbook |
| D2 | AI cost/budget | Control runaway cost | Usage table | Alerts or cap per tenant/global | Dashboard |
| D3 | Admin DLQ view | Failed job visibility | None | Admin UI: filter failed, retry | Manual check |
| D4 | Rate limit expansion | Abuse prevention | None | Login and sensitive paths limited | Config review |
