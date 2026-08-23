# Phase 12 — Client Day-0

**Date:** 2026-08-23  
**RC baseline:** `v1.0.0-rc.1` @ `a7144249` (`a714424`)  
**Branch:** `feature/phase12-client-day0-2026-08-23`  
**Target:** Staging dry-run @ `https://staging.aistroyka.ai`  
**Status:** **CLOSED (BLOCKED)**

---

## 1. Phase gate

Pilot tenant ready for **first real client Day-0** without engineering intervention: intake complete, tenant/project/roles provisioned, device smoke, support path, owner + client sign-off.

---

## 2. Intake validation

| Check | Result |
|-------|--------|
| `pilot-intake.real.local.json` (gitignored) | **MISSING** — no real client intake on operator machine |
| `validate_pilot_intake.mjs` on `pilot-intake.template.json` | **NOT READY** — all launch-critical fields empty (expected for template) |
| Client company / sponsor / contact | **NOT PROVIDED** |
| Owner sign-off | **PENDING** |
| Client sign-off | **PENDING** |

---

## 3. Tenant / project provisioning

| Item | Result |
|------|--------|
| Dedicated client staging tenant | **NOT CREATED** |
| Dedicated client production tenant | **NOT AUTHORIZED** |
| Client project + tasks | **NOT CREATED** |
| Manager/worker invites (client emails) | **NOT SENT** |
| Reuse smoke tenant for client | **FORBIDDEN** without owner approval |

**Existing smoke tenant** (`.env.pilot` credentials) remains valid for platform dry-run only.

---

## 4. Platform dry-run (@ RC `a714424`, staging, 2026-08-23)

| Script | Result |
|--------|--------|
| `bash scripts/smoke/pilot_launch.sh` | **PROVEN** PASS |
| `bash scripts/smoke/ios_mobile_api_chain.sh` | **PROVEN** PASS — worker create+sync, manager reports+intelligence |
| `bash scripts/smoke/security_headers.sh` | **PROVEN** PASS (Phase 10/11) |
| Physical iOS TestFlight device smoke | **NOT TESTED** — no device connected |
| Stakeholder portal smoke | **BLOCKED_EXTERNAL** — `STAKEHOLDER_SMOKE_*` missing |

---

## 5. Android / store policy

| Item | Result |
|------|--------|
| Android required for first pilot | **NO** — deferred by decision |
| iOS TestFlight upload | **OWNER_ACTION_REQUIRED** |
| Launch blocked by Android absence | **NO** |

---

## 6. Blockers (launch NO-GO)

| # | Blocker | Type |
|---|---------|------|
| 1 | Real client intake not completed | **BLOCKED_EXTERNAL** |
| 2 | No client tenant/project on staging or production | **BLOCKED_EXTERNAL** |
| 3 | Physical device / TestFlight smoke incomplete | **BLOCKED_EXTERNAL** |
| 4 | Support email not finalized for client | **BLOCKED_EXTERNAL** |
| 5 | Owner + client sign-off missing | **BLOCKED_EXTERNAL** |
| 6 | PR #229 forgot-password not on staging | **OPEN** — engineering (non-client) |

---

## 7. Closure verdict

**NO** — **Launch allowed: NO**

Platform dry-run on staging @ `v1.0.0-rc.1` is **PROVEN**; **client Day-0 is BLOCKED_EXTERNAL** until owner completes intake, authorizes tenant provisioning, and executes device/sign-off checklist.

Do **not** proceed to Phase 13 (Controlled Pilot) with a **YES** until intake + tenant + sign-offs close.

**Next (owner/operator):**

1. Complete `docs/launch/pilot-intake.real.local.json` (gitignored) from `pilot-intake.template.json`.
2. Run `node scripts/pilot/validate_pilot_intake.mjs` → **READY**.
3. Provision staging tenant/project per `PILOT_DAY0_TENANT_PROJECT_SETUP.md`.
4. Physical iOS device smoke + owner/client sign-off.

---

*Phase 12 — 100% Readiness execution.*
