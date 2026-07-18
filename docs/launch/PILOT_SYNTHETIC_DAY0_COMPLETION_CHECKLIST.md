# Pilot Synthetic Day 0 — Completion Checklist

**Date:** 2026-07-03  
**Environment:** `https://staging.aistroyka.ai`  
**Intake:** synthetic (`pilot-intake.real.local.json`, gitignored)  
**Real client launch:** **not in scope**

Mark each item when verified on **staging** with synthetic `@example.com` users.

---

## A. User / account readiness

| # | Check | Done | 2026-07-18 |
|---|-------|------|------------|
| A1 | `owner.demo@example.com` exists in Auth | ☑ | **PASS** |
| A2 | `carlos.manager@example.com` exists | ☑ | **PASS** |
| A3 | `elena.manager@example.com` exists | ☑ | **PASS** |
| A4 | `ivan.worker@example.com` exists | ☑ | **PASS** |
| A5 | `pavel.worker@example.com` exists | ☑ | **PASS** |
| A6 | `luis.worker@example.com` exists | ☑ | **PASS** |
| A7 | `sofia.client@example.com` exists | ☑ | **PASS** |
| A8 | Tenant roles assigned (owner/admin/member/stakeholder) | ☑ | **PASS** |
| A9 | Project memberships for managers + workers | ☑ | **PASS** 2026-07-18 — Carlos manager + Ivan worker on Eixample project |
| A10 | Stakeholder project_stakeholders row active | ☑ | **PASS** 2026-07-18 — sofia.client@example.com active |

**Evidence:** `PILOT_SYNTHETIC_USERS_PROVISIONING_REPORT.md`

**Guide:** `PILOT_SYNTHETIC_USERS_STAGING_CHECKLIST.md`

---

## B. Dataset readiness

| # | Check | Done |
|---|-------|------|
| B1 | Tenant/project exists (`Demo Apartment Renovation — Eixample`) | ☑ **PASS** 2026-07-18 |
| B2 | Tasks created (≥3) | ☑ **PASS** (3, assigned to Ivan) |
| B3 | Milestone created | ☑ **PASS** |
| B4 | Document created (demo act) | ☑ **PASS** |
| B5 | Cost item created (internal) | ☑ **PASS** |
| B6 | Pending manager action (submitted report or doc) | ☑ **PASS** (submitted report) |

**Prerequisite:** Owner approval per `PILOT_SYNTHETIC_DATASET_APPLY_DECISION.md` before `--apply`.

---

## C. Flow smoke

### Worker path

| # | Check | Done |
|---|-------|------|
| C1 | Worker login (iOS TestFlight or API) | ☑ **PASS** 2026-07-18 — iOS Worker Xcode build `2026071807` @ `f088ed3` (Ivan); TF `2026063001` not used |
| C2 | Worker sees assigned tasks | ☑ **PASS** 2026-07-18 — Pilot task 1 + task chat UITest |
| C3 | Worker report create | ☐ PARTIAL (API PASS 2026-07-03 with smoke user) |
| C4 | Media upload (before/after photos) | ☐ |
| C5 | Submit + sync | ☐ PARTIAL (API create/sync only) |

### Manager path

| # | Check | Done |
|---|-------|------|
| C6 | Manager login (web and/or iOS) | ☐ PARTIAL — Carlos API login OK; Manager app installed `2026071807`; Manager task-chat media UI not completed |
| C7 | Manager reads report in inbox | ☐ PARTIAL (API list PASS) |
| C8 | Manager views report media | ☐ |
| C9 | Manager **approve** OR **reject** OR **request changes** | ☐ |

### Stakeholder path

| # | Check | Done |
|---|-------|------|
| C10 | Stakeholder portal login | ☐ |
| C11 | Stakeholder sees approved/safe progress | ☐ |
| C12 | Internal cost / margin / contractor finance **denied** | ☐ |

**Task chat device UI (related, not a substitute for C4–C12):** see `TASK_CHAT_DEVICE_UI_SMOKE_REPORT.md` — TEXT / DELETE / AUTHORIZATION / CROSS_TENANT **PASS**; PHOTO/VOICE **FAIL** (retest blocked on USB); VIDEO **BLOCKED**; OFFLINE media **REFUSED_BY_DESIGN**; `size_bytes` local PASS / prod FAIL until deploy; E2E **NO**; TestFlight **NO**.

**Automated partial evidence:** `PILOT_SYNTHETIC_DAY0_SMOKE_REPORT.md`

---

## D. Final verdict

| Field | Current (2026-07-18) |
|-------|----------------------|
| **Synthetic Day 0 complete** | **NO** |
| **Blockers** | C3–C5/C6–C9/C10–C12 open; task_chat photo/voice/video/offline-media open; no TF task_chat build |
| **Next action** | Manual media UI on device; Day 0 report/manager/stakeholder; TF only with new build number |

### Complete = YES only when

- All **A1–A10** checked
- All **B1–B6** checked (or explicitly N/A with owner note)
- All **C1–C12** checked (C3/C5/C7 may upgrade from PARTIAL to full UI proof)

---

## Real client

| Field | Value |
|-------|-------|
| Real client launch | **NO-GO** (unchanged) |

---

## Related

- `PILOT_SYNTHETIC_DAY0_GO_NO_GO.md`
- `PILOT_SYNTHETIC_DATASET_APPLY_DECISION.md`
- `PILOT_SYNTHETIC_USERS_STAGING_CHECKLIST.md`
