# Phase 4 — mobile_backend_contracts_closure

**Date:** 2026-07-29  
**Batch:** `Phase 4 — mobile_backend_contracts`  
**Repo:** `/Users/alex/Projects/AISTROYKA`  
**Constraints honored:** no commit, push, deploy, migration apply, tenant creation, platform grant creation, business data broadening, or secret/ID/JWT disclosure.

This document is the **final Phase 4 closure report** for mobile backend contracts derived from native iOS/Android Manager and Worker callsites.

---

## Dual verdict (current)

| Verdict | Result |
| --- | --- |
| **Phase 4 local contract** | **YES** |
| **Phase 4 loopback E2E** | **YES** (10 passed / 0 failed / 0 skipped via `e2e:phase4`) |
| **Mobile backend contracts from native callsites** | **YES** |
| **Live push APNS/FCM** | **BLOCKED_EXTERNAL** (credentials / QA token MISSING) |
| **Live strict idempotency DB** | **BLOCKED_EXTERNAL** (rate-limit migration unapplied; do **not** claim applied) |
| **Cleanup proved** | **YES** |
| **Overall Phase 4** | **YES** |
| **Safe to proceed to Phase 5** | **YES** |

---

## Scope summary

Phase 4 covered the backend contracts actually used by native mobile callsites:

| Surface | Covered contracts |
| --- | --- |
| Worker lifecycle | discovery, task list/detail, day start/end, report create/add-media/submit |
| Media | upload session create/finalize plus Supabase Storage object upload path contract |
| Sync | bootstrap, changes, ack, device cursor conflict handling |
| Devices / push registration | register/unregister local and transport contract |
| Manager review | project/report/workers/ops discovery plus report read/review |
| Help / activation | activation status, hints, assistant, assistant events |
| Lite isolation | `ios_worker`, `android_worker`, `ios_lite`, `android_lite` fail closed outside the mobile allow-list |

Detailed endpoint matrix: `docs/roadmap/AISTROYKA_PHASE4_MOBILE_BACKEND_MATRIX.csv`.

---

## Authorization scope actually used

Owner-authorized temporary AISTROYKA Cloud fixture only:

| Allowed | Count / detail |
| --- | --- |
| Temporary auth users | manager plus workers A/B |
| Tenant membership | temp manager/member plus workers A/B in the smoke active tenant |
| Project roles | manager and worker roles only, scoped to the smoke project fixture |
| Devices | deterministic temporary Phase 4 device IDs |
| Business writes | only Phase 4 smoke worker lifecycle/media/sync/device rows required by the suite |

**Not created:** tenants, platform grants, additional tenant grants, platform-owner grants, billing data, customer/owner portal data, external push sends, deployments, migrations, or real pilot PII.

---

## Sanitized target resolution

| Check | Result |
| --- | --- |
| Web target | loopback Next.js (`127.0.0.1` / localhost class) |
| Supabase | AISTROYKA Cloud |
| Public / anon / service JWT refs | MATCH + AISTROYKA ref match (sanitized; no IDs/secrets printed here) |
| Service-role JWT | PRESENT and real-shaped locally; placeholder rejected |
| Base URL | loopback required by preflight |
| Hardcoded tenant/pilot IDs | not used in the report |
| Secret disclosure | none |

---

## Suite counts

Recorded from the successful Phase 4 gate:

| Suite | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Phase 4 preflight | exit 0 | — | — |
| `e2e:phase4` | 10 | 0 | 0 |

Suite coverage:

| Spec | Proof |
| --- | --- |
| `a-worker-lifecycle.spec.ts` | worker lifecycle, report/media flow, idempotent writes, device register/unregister |
| `b-manager-review.spec.ts` | iOS/Android manager discovery, listing, report read/review |
| `c-sync-conflict.spec.ts` | required device ID, future cursor recovery, invalid cursor rejection, independent device cursors |
| `d-lite-isolation.spec.ts` | lite path forbid for admin/billing/platform/AI/media inventory/legacy bypasses; manager profiles not misclassified as lite |

---

## Unit / repository gates

| Gate | Result |
| --- | --- |
| Phase 4 no-skip contract | PASS |
| Native callsite inventory audit | PASS |
| Local / transport push contract unit coverage | YES |
| `e2e:phase4` | PASS (10 / 0 / 0) |
| Live APNS / FCM send | BLOCKED_EXTERNAL |
| Live strict idempotency DB RPC | BLOCKED_EXTERNAL |

Live push remains blocked because APNS/FCM credentials and the QA token were missing. Live strict idempotency remains blocked because the rate-limit migration is unapplied; Phase 4 did **not** apply migrations and does **not** claim the RPC exists live.

---

## Fixes captured by Phase 4

| Defect / gap | Fix / result |
| --- | --- |
| Cloudflare Worker API middleware bypass could skip lite guarding | Handler-level lite allow-list enforced through `getTenantContextFromRequest` and `LitePathForbiddenError` |
| Lite mobile clients could reach forbidden or sibling paths in some handler paths | Exact `lite_client_path_forbidden` responses covered for forbidden and sibling paths |
| Legacy idempotency selected `claim_token` where the live DB may not have that column | Legacy idempotency now omits `claim_token` writes and falls back when the column is absent |
| Strict idempotency DB proof depends on unapplied rate-limit migration | Documented as `BLOCKED_EXTERNAL`; migration not applied |
| Lite idempotency could become unsafe without admin store | Fail-closed behavior retained when admin/service store is unavailable |
| Placeholder service-role value could pass preflight shape too loosely | Service-role placeholder rejection enforced |
| Local web `.env.local` contained a PASTE placeholder | Replaced locally in gitignored env only; no secret committed or printed |

---

## Push status

| Push layer | Result |
| --- | --- |
| Device register/unregister contract | YES |
| Local / transport contract from existing unit tests | YES |
| Live APNS send | BLOCKED_EXTERNAL — credential missing |
| Live FCM send | BLOCKED_EXTERNAL — credential missing |
| QA token live-send gate | BLOCKED_EXTERNAL — missing |

Phase 4 does not claim live push delivery. The phase proves the mobile/backend registration and transport contract that can be exercised without external credentials.

---

## Cleanup proof

| Record | Result |
| --- | --- |
| `PHASE4 TEMP` fixture residue | 0 |
| Temporary smoke rows | cleaned by orchestrated lifecycle |
| Smoke active tenant | unchanged |
| Smoke membership / grants | unchanged |
| Tenant creation | not performed |
| Grant creation | not performed |

---

## Remaining Phase 4 blockers

| Blocker | Classification | Reason |
| --- | --- | --- |
| Live APNS / FCM push send | BLOCKED_EXTERNAL | APNS/FCM credentials and QA token missing |
| Live strict idempotency DB RPC | BLOCKED_EXTERNAL | rate-limit migration unapplied; migration application is operator-gated |

No local Phase 4 blocker remains.

---

## Safe to proceed

**Safe to proceed to Phase 5:** YES.

Phase 5 may start from the proven mobile backend contract surface. Phase 5 must still independently validate iOS pilot readiness, simulator/device behavior, signing/TestFlight path if scoped, and any external credentials required for live smoke.

---

## Confirmation

No commit, push, deploy, migration apply, tenant creation, platform grant creation, unauthorized business mutation, historical Phase 3 verdict modification, or secret/ID/JWT disclosure. Unrelated dirty worktree preserved. Phase 5 (`iOS pilot readiness`) may proceed.
