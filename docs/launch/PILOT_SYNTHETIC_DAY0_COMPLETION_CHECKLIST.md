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
| A9 | Project memberships for managers + workers | ☐ | **NOT CREATED** (dataset gate) |
| A10 | Stakeholder project_stakeholders row active | ☐ | **NOT CREATED** (dataset gate) |

**Evidence:** `PILOT_SYNTHETIC_USERS_PROVISIONING_REPORT.md`

**Guide:** `PILOT_SYNTHETIC_USERS_STAGING_CHECKLIST.md`

---

## B. Dataset readiness

| # | Check | Done |
|---|-------|------|
| B1 | Tenant/project exists (`Demo Apartment Renovation — Eixample`) | ☐ |
| B2 | Tasks created (≥3) | ☐ |
| B3 | Milestone created | ☐ |
| B4 | Document created (demo act) | ☐ |
| B5 | Cost item created (internal) | ☐ |
| B6 | Pending manager action (submitted report or doc) | ☐ |

**Prerequisite:** Owner approval per `PILOT_SYNTHETIC_DATASET_APPLY_DECISION.md` before `--apply`.

---

## C. Flow smoke

### Worker path

| # | Check | Done |
|---|-------|------|
| C1 | Worker login (iOS TestFlight or API) | ☐ |
| C2 | Worker sees assigned tasks | ☐ |
| C3 | Worker report create | ☐ PARTIAL (API PASS 2026-07-03 with smoke user) |
| C4 | Media upload (before/after photos) | ☐ |
| C5 | Submit + sync | ☐ PARTIAL (API create/sync only) |

### Manager path

| # | Check | Done |
|---|-------|------|
| C6 | Manager login (web and/or iOS) | ☐ |
| C7 | Manager reads report in inbox | ☐ PARTIAL (API list PASS) |
| C8 | Manager views report media | ☐ |
| C9 | Manager **approve** OR **reject** OR **request changes** | ☐ |

### Stakeholder path

| # | Check | Done |
|---|-------|------|
| C10 | Stakeholder portal login | ☐ |
| C11 | Stakeholder sees approved/safe progress | ☐ |
| C12 | Internal cost / margin / contractor finance **denied** | ☐ |

**Automated partial evidence:** `PILOT_SYNTHETIC_DAY0_SMOKE_REPORT.md`

---

## D. Final verdict

| Field | Current (2026-07-03) |
|-------|----------------------|
| **Synthetic Day 0 complete** | **NO** |
| **Blockers** | Users not created; dataset not applied; media/approval/stakeholder smokes open |
| **Next action** | Complete `PILOT_SYNTHETIC_USERS_STAGING_CHECKLIST.md` → owner dataset decision → finish C4–C12 |

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
