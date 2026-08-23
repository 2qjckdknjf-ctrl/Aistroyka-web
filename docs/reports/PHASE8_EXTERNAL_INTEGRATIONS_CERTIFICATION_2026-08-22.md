# Phase 8 — External Integrations Certification

**Date:** 2026-08-22  
**Baseline SHA:** `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`)  
**Branch:** `feature/phase8-integrations-certification-2026-08-22`  
**Target:** `https://staging.aistroyka.ai` (`buildStamp.sha7=a714424`)  
**Status:** **IN PROGRESS**

---

## 1. Push — device registration (API contract)

| Check | Result |
|-------|--------|
| `POST /api/v1/devices/register` @ staging (authenticated) | **PROVEN** — HTTP 200 `{ success: true }` |
| `POST /api/v1/devices/unregister` @ staging | **PROVEN** — HTTP 200 `{ success: true }` |
| `ios_lite` idempotency requirement | **PROVEN** — unit tests in `devices/register/route.test.ts` |
| Push outbox + drain job unit tests | **PROVEN** — 216 tests PASS (`lib/platform/push`, `push-send`, `devices`, `billing`) |

## 2. Push — live delivery (APNs / FCM)

| Check | Result |
|-------|--------|
| APNs live delivery to physical device | **NOT TESTED** — no device connected; synthetic tokens must not receive live push |
| FCM live delivery on Android device | **NOT TESTED** — Android deferred; placeholder `google-services.json` on `main` |
| `POST /api/v1/admin/push/test` enqueue | **NOT TESTED** — requires tenant admin session; no live drain/send proof this pass |
| Production `pushConfigured` runtime proof | **NOT TESTED** — env-gated (`APNS_*` / `FCM_*`); Operations Center probe only |

**Policy:** Outbox enqueue + provider router are implemented; live send remains **owner/env gated** per `docs/runbooks/PUSH_DELIVERY.md`.

## 3. Email — transactional paths

| Flow | Result |
|------|--------|
| Supabase Auth `POST /auth/v1/recover` | **PROVEN** — HTTP 200 (infrastructure password-reset email path) |
| App `POST /api/v1/auth/forgot-password` | **NOT DEPLOYED** — HTTP 404 on staging (PR #229 pending merge) |
| Team / stakeholder invitation email | **NOT TESTED** — `tenant_invitations` table + UI exist; no live mailbox proof this pass |

## 4. Billing

| Check | Result |
|-------|--------|
| Required for first commercial pilot Day-0? | **DEFERRED BY DECISION** — controlled pilot defaults to non-billing entitlement path unless owner enables live checkout cohort |
| `POST /api/v1/billing/checkout-readiness` @ staging | **PROVEN** route live — HTTP 400 validation (auth OK; schema enforced) |
| Stripe webhook + adapter unit tests | **PROVEN** — billing route/handler tests PASS |
| Live Stripe checkout E2E | **NOT TESTED** — not required for current pilot defer policy |

## 5. Blockers

| Blocker | Type |
|---------|------|
| Live APNs/FCM delivery proof | **BLOCKED_EXTERNAL** — device + provider env + no synthetic token sends |
| App password-recovery email UI/API | **BLOCKED** on staging until PR #229 merge |
| Invitation email live proof | **BLOCKED_EXTERNAL** — mailbox access not exercised |
| Billing activation for all tenants | **DEFERRED BY DECISION** — post-pilot / cohort-gated |

## 6. Closure verdict

**CONDITIONAL YES** — device register/unregister and billing readiness routes are **PROVEN** on staging; push/email live delivery and billing activation are explicitly **NOT TESTED** or **DEFERRED** per pilot policy. Safe to proceed to Phase 9 (Full Persona E2E) without treating push/billing live proof as launch blockers for controlled pilot.

**Next:** merge PR #229 for app-level password recovery; owner-gated push delivery smoke on real device; Play/APNs env proof when Mode B store track opens.

---

*Phase 8 — 100% Readiness execution.*
