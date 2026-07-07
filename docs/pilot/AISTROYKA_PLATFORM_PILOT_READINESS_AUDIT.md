# AISTROYKA Platform Pilot Readiness Audit

**Date:** 2026-07-07  
**Branch:** `security/platform-admin-separation`  
**Auditors:** Cursor agent (Principal Product / Release / QA / Delivery)  
**Scope:** Real pilot client readiness — code, deployment, flows, mobile, isolation  
**ROMA:** Observability only — Foundation v1.0.0 frozen; no ROMA feature work in this audit

---

## Executive summary

The **platform engineering contour is substantially ready** on staging and production (health, config, worker API chain, AI live, tenant metrics). A **real pilot client cannot start yet** because operational prerequisites remain open: no client-specific tenant, no physical iOS device smoke, and no closed-loop proof of media upload + manager approval on the client path.

**Two code P0 blockers were fixed on this branch:** monorepo `cf:build` type error in `roma-platform-integration.ts`, and vitest parse failure in `AISignalLine.test.ts`.

**Pilot verdict:** `PARTIAL` — platform ready for provisioning; client kickoff blocked on owner/operator Day 0 steps.

---

## Phase 0 — Current state (evidence)

### Deployments

| Environment | Health | buildStamp.sha7 | Evidence |
|-------------|--------|-----------------|----------|
| Staging | `ok:true`, `db:ok` | `e6170ce` | `GET https://staging.aistroyka.ai/api/v1/health` 2026-07-07 |
| Production | `ok:true`, `db:ok` | `e6170ce` | `GET https://aistroyka.ai/api/v1/health` 2026-07-07 |

Staging and production share the same deployed SHA (2026-07-05 builds).

### Validation run (2026-07-07)

| Check | Result | Notes |
|-------|--------|-------|
| `bun run build` | **PASS** | After `roma-platform-integration` type fix |
| `bun run cf:build` | **PASS** | OpenNext worker bundle |
| `bun run vitest run` | **PASS** | 1764/1764 after `AISignalLine.helpers` extraction |
| `scripts/smoke/security_headers.sh` staging | **PASS** | HSTS, CSP, frame options |
| `scripts/smoke/ai_live_provider.sh --require-live` | **PASS** | Live LLM, no fallback |
| `scripts/smoke/pilot_launch.sh` staging (with creds) | **PARTIAL** | health, config, ops/metrics PASS; cron-tick intermittent `ok:false` in script (direct curl `ok:true`) |
| `scripts/smoke/ios_mobile_api_chain.sh` staging | **PASS** | worker create+sync; manager me+reports+intelligence |
| `GET /en`, `/en/login` production | **PASS** | HTTP 200 |
| `GET /api/v1/portal/projects` unauth | **PASS** | HTTP 401 (fail-closed) |
| Manager approvals pending (staging smoke user) | **OPEN** | 0 submitted reports in queue at audit time |
| Physical iOS TestFlight smoke | **BLOCKED** | No client device in session (`PILOT_DAY0_DEVICE_SMOKE_REPORT.md`) |

---

## Phase 1 — Readiness matrix

| Component | Current state | Evidence | Blockers | Priority | Fix needed |
|-----------|---------------|----------|----------|----------|------------|
| Public website | **READY** | `/en` 200; security headers PASS | None material | P3 | — |
| Tenant web dashboard | **PARTIAL** | Routes exist; auth redirect 307; nav e2e specs | Full approval E2E not automated | P1 | Day 0 manual smoke + optional Playwright |
| Platform Admin | **READY** | ROMA probes; platform-admin tests 203 pass | Uses ROMA as observability only | P3 | — |
| Owner/client portal | **PARTIAL** | Portal APIs + finance denylist tests; unauth 401 | No client tenant; stakeholder e2e creds absent | P1 | Provision client + run portal smoke |
| Worker reports flow | **PARTIAL** | API create/sync PASS on staging; domain service complete | No web worker UI; media upload e2e OPEN | P1 | iOS device smoke with photos |
| Manager review flow | **PARTIAL** | UI + PATCH API + pending queue implemented | Approve/reject not executed in live smoke | P1 | Manager action on submitted report |
| Projects/tasks/documents | **READY** | Dashboard routes + APIs; pilot task spec | — | P2 | — |
| Costs (Step 13) | **READY** | P0 cost layer verified per `P0_GO_NO_GO.md` | — | P3 | — |
| AI Copilot / analysis | **READY** | `ai_live_provider.sh` GO; intelligence API in mobile chain | — | P3 | — |
| Supabase DB/RLS/storage | **PARTIAL** | Health `db:ok`; unit tests for policies | Cross-tenant Playwright negative absent | P2 | Optional isolation e2e |
| Notifications | **PARTIAL** | Push outbox probe; FCM/Telegram env-gated | APNs stub when unconfigured; email global health UNKNOWN | P2 | Configure push for pilot if required |
| Billing / subscriptions | **PARTIAL** | Legacy entitlements inventory; Stripe dual-write | Account-layer cutover gated; pilot can run without billing switch | P3 | Owner billing policy for pilot |
| iOS Manager | **PARTIAL** | Source complete; API chain PASS | TestFlight on-device smoke BLOCKED | P0 | Client devices + TestFlight checklist |
| iOS Worker | **PARTIAL** | Source complete; report create API PASS | Media UI + submit on device OPEN | P0 | Physical device smoke |
| Android Manager/Worker | **BLOCKED** | Compose scaffolds on `main` | P3 defer — not in first pilot SLA | P3 | Owner reversal only if client mandates |
| Production deployment | **READY** | Health OK, sha7 `e6170ce` | No production client tenant authorized | P1 | Owner authorization |
| Staging deployment | **READY** | Health OK; smokes PASS with creds | — | — | — |
| Authentication / registration | **READY** | Login/register/invite routes; qa/02-auth | OAuth buttons env-gated | P2 | — |
| Roles / RBAC / tenant isolation | **PARTIAL** | Middleware + route tests; lite allow-list | Multi-role QA skips without creds | P1 | `role_smoke` or manual role matrix |
| Pilot onboarding flow | **PARTIAL** | Onboarding wizard + `validate_pilot_intake.mjs` | Client intake not completed with real data | P0 | Owner completes intake |

**Status key:** READY = evidence supports use | PARTIAL = usable with gaps/workarounds | BLOCKED = cannot use | UNKNOWN = no evidence (not used when evidence exists)

---

## Phase 2 — Blocker classification

### P0 — Pilot cannot start

| ID | Blocker | Type | Status |
|----|---------|------|--------|
| P0-OPS-1 | No real client intake (company, sponsor, workers, devices) | Operational | **OPEN** |
| P0-OPS-2 | No client-specific tenant / project / invites | Operational | **OPEN** |
| P0-OPS-3 | Physical iOS TestFlight device smoke not executed | Operational | **OPEN** |
| P0-OPS-4 | Media upload + submit + manager approval closed loop not proven on client path | Operational | **OPEN** |
| P0-CODE-1 | `cf:build` type error in `roma-platform-integration.ts` | Code | **FIXED** (this audit) |
| P0-CODE-2 | `AISignalLine.test.ts` vitest parse failure (326th file) | Code | **FIXED** (this audit) |

### P1 — Pilot can start only with manual workaround

| ID | Blocker | Workaround |
|----|---------|------------|
| P1-1 | No automated full worker→manager approval Playwright | Manual API + web UI on staging |
| P1-2 | `pilot_launch.sh` cron-tick intermittent false negative | Direct health + metrics; set `CRON_SECRET` for full pass |
| P1-3 | `scripts/pilot/setup_pilot_dataset.sh` / `role_smoke.sh` absent | Dashboard provisioning per `P4_TENANT_ACCOUNT_SETUP_RUNBOOK.md` |
| P1-4 | Production pilot tenant not owner-authorized | Staging-only pilot until sign-off |
| P1-5 | Support email not finalized | Use interim owner channel per runbook |

### P2 — Important, not launch-blocking

| ID | Item |
|----|------|
| P2-1 | Duplicate report detail routes (`/dashboard/reports/[id]` vs `/daily-reports/[id]`) |
| P2-2 | QA nav smoke omits `/dashboard/approvals` |
| P2-3 | Cross-tenant negative e2e absent |
| P2-4 | Worker video / text comment gaps (documented waivers) |
| P2-5 | Android deferred per P3 — engineering scaffold only |

### P3 — Later improvement

| ID | Item |
|----|------|
| P3-1 | Account-layer entitlement cutover (`ENTITLEMENT_RESOLUTION_SOURCE`) |
| P3-2 | Email outbox global health probe |
| P3-3 | Performance/SLO telemetry |
| P3-4 | Android Worker MVP (when owner authorizes) |

---

## Phase 3 — Fixes applied (this audit)

| Fix | File(s) | Why P0 |
|-----|---------|--------|
| Typed `ProbeOutcome` missing-service-role branch | `lib/platform-admin/roma-platform-integration.ts` | Blocked `bun run build` / `cf:build` on branch |
| Extract pure helpers from TSX component | `components/ai/AISignalLine.helpers.ts`, `AISignalLine.tsx`, `AISignalLine.test.ts` | Vitest Rolldown JSX parse failure; CI red |

**Not changed:** ROMA Foundation, kernel, RBAC, security gates, Cloudflare config, tenant isolation logic, billing behavior.

---

## Phase 4 — Validation evidence

```bash
# Build + tests
bun run build                    # PASS
bun run cf:build                 # PASS
cd apps/web && bun run vitest run  # 1764 passed

# Staging smokes (requires .env.pilot + apps/web/.env.local)
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/ios_mobile_api_chain.sh
bash scripts/smoke/ai_live_provider.sh --require-live
bash scripts/smoke/security_headers.sh https://staging.aistroyka.ai

# Intake validator (local only)
node scripts/pilot/validate_pilot_intake.mjs docs/launch/pilot-intake.example.json
# Verdict: READY (example); Day 0 checklist warnings expected
```

---

## Phase 5 — Remaining manual steps (operator)

1. **Owner:** Complete `docs/launch/P4_PILOT_CLIENT_INTAKE.md` with real client data; sign Android defer if not already.
2. **Owner:** Authorize staging → production tenant when staging setup passes.
3. **Operator:** Provision tenant, project, roles per `P4_TENANT_ACCOUNT_SETUP_RUNBOOK.md` and `P4_PROJECT_SETUP_RUNBOOK.md`.
4. **Operator + client:** Run `PILOT_DAY0_DEVICE_SMOKE_REPORT.md` on physical iPhones (Worker + optional Manager).
5. **Operator:** Execute worker report with **photos** → manager approve/reject on web or iOS.
6. **Operator:** Run stakeholder portal smoke with client credentials (finance denylist).
7. **Owner + sponsor:** Sign `P4_LAUNCH_GO_NO_GO_CHECKLIST.md`.

---

## Final pilot verdict

| Gate | Verdict |
|------|---------|
| Platform engineering (staging) | **READY** for client provisioning |
| Platform engineering (production) | **READY** (health); client tenant **NOT AUTHORIZED** |
| Client Day 0 kickoff | **NO-GO** until P0-OPS items closed |
| Android in first pilot | **OUT OF SCOPE** (P3 defer) |
| **Overall PILOT_READY** | **PARTIAL** |

---

## Document control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Initial platform pilot readiness audit |
