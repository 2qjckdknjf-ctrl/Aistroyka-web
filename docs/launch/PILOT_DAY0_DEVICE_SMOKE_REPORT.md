# Pilot Day 0 — Device / TestFlight Smoke Report

**Date:** 2026-07-03  
**Target build:** TestFlight **2026063001** (per program docs)  
**Client devices:** **NOT AVAILABLE** in operator session

---

## Verification matrix

| Check | Result | Notes |
|-------|--------|-------|
| iOS Worker installed on client device | **NOT TESTED** | No client device connected |
| iOS Manager installed on client device | **NOT TESTED** | |
| Build number confirmed | **NOT TESTED** | Expected `2026063001` |
| Worker login | **NOT TESTED** (UI) | API login path PASS on staging — see dry-run |
| Worker report + media + submit | **PARTIAL** | Report create API PASS; **media UI not tested** |
| Manager login | **NOT TESTED** (UI) | |
| Manager report view + decision | **OPEN** | Approve/reject not executed in dry-run |

---

## Prior program evidence

From `docs/pilot/P0_PILOT_E2E_VERIFICATION.md`:

- TestFlight build `2026063001` — ASC VALID
- Physical device smoke — **BLOCKED** (iPhone offline / no adb)

Day 0 reproduces same gap: **distribution ready, on-device checklist incomplete**.

---

## Operator checklist (execute when client + devices available)

### Worker (iPhone, TestFlight)

1. Install AiStroyka Worker from TestFlight invite.
2. Settings/Diagnostics → confirm build **2026063001**.
3. Sign in with client worker credentials.
4. Start shift → select task → create report → attach before/after photos → submit.
5. Confirm status `submitted`; note report ID in secure log.

### Manager (iPhone optional / web primary)

1. Install AiStroyka Manager OR use web dashboard.
2. Open reports inbox → open worker report → approve or request changes.
3. Confirm worker sees feedback (if changes requested).

---

## Fallback

If TestFlight blocked: manager uses **web dashboard** for review; worker delay until device available — **launch NO-GO** for field pilot.

---

## Verdict

| Gate | Result |
|------|--------|
| Device smoke | **FAIL / BLOCKED** |
| Blocks client kickoff | **YES** |
| Blocks staging platform readiness | **NO** |

**Next action:** Owner/client confirm iOS devices; run checklist above on Day 0 with sponsor present.
