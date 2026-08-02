# P4 — Launch GO / NO-GO Checklist

**Date:** 2026-07-03 (Day 0 update)  
**Use:** Complete immediately before client kickoff.

---

## Client and scope

- [ ] **Pilot Intake Card completed** (`PILOT_INTAKE_CARD.md` or filled JSON)
- [ ] **Pilot intake JSON validated** (`node scripts/pilot/validate_pilot_intake.mjs …` → READY)
- [ ] **Owner/client signoff recorded** in intake `goNoGo` section
- [ ] Client selected and intake form completed — **FAIL** (required fields MISSING)
- [ ] Pilot sponsor named and reachable — **FAIL**
- [x] **Android not required** OR defer accepted — **PASS** (P3 defer; default NO)
- [ ] Client brief sent — **FAIL** (draft only; TBD placeholders)
- [ ] Pilot duration agreed — **PARTIAL** (default 4 weeks)

---

## Devices and apps

- [ ] **iOS devices ready** for all field workers — **FAIL** (not confirmed)
- [ ] TestFlight build **2026063001** available — **PASS** (program evidence)
- [ ] TestFlight installed and login verified on ≥1 worker + ≥1 manager — **FAIL** (device smoke BLOCKED)
- [ ] Web browsers verified for managers and stakeholders — **NOT TESTED**

---

## Accounts and access

- [x] Environment chosen: staging dry-run — **PASS**
- [ ] Production pilot — **NOT AUTHORIZED**
- [ ] Tenant / account created for **client** — **FAIL**
- [ ] Owner active — **FAIL**
- [ ] Manager(s) invited — **FAIL**
- [ ] Worker(s) invited (min 2) — **FAIL**
- [ ] Stakeholder(s) invited — **N/A / FAIL**
- [ ] Roles and project memberships — **FAIL**
- [ ] Credentials in secure store — **N/A**

---

## Project and data

- [ ] Project created — **FAIL**
- [ ] Tasks/milestones ready — **FAIL**
- [ ] Documents — N/A
- [ ] Cost items (internal) — N/A
- [x] Staging smoke before production — **PASS** (`PILOT_DAY0_STAGING_DRY_RUN.md`)

---

## Functional smoke

- [x] `GET /api/v1/health` OK staging — **PASS** (`7f1b42f`)
- [ ] Worker report + **media** — **PARTIAL** (API create PASS; media OPEN)
- [ ] Manager approval action — **OPEN**
- [ ] Stakeholder view / finance isolation — **OPEN**
- [x] `pilot_launch.sh` staging — **PASS**
- [x] `ios_mobile_api_chain.sh` staging — **PASS**

---

## Operations

- [ ] Support email live — **FAIL** (TBD)
- [ ] L1/L2/L3 documented — **PARTIAL** (runbooks exist)
- [x] Success metrics defined — **PASS**
- [ ] First-week protocol shared with client — **FAIL** (no client)
- [ ] Limitations accepted by client — **FAIL**

---

## Sign-off

| Gate | Name | Date | APPROVED |
|------|------|------|----------|
| **Owner (AISTROYKA)** | MISSING | | |
| **Client pilot sponsor** | MISSING | | |

---

## Final verdict (Day 0)

| Field | Value |
|-------|-------|
| **Launch allowed** | **NO** |
| **Blockers** | Client intake incomplete; no client tenant; device smoke blocked; owner/client sign-off missing; production not authorized; support email TBD; media/approval/stakeholder smokes OPEN |
| **Owner decision** | Pending — provide intake + authorize production when ready |

---

## Related docs

- `docs/launch/PILOT_INTAKE_CARD.md`
- `docs/launch/pilot-intake.template.json`
- `docs/launch/PILOT_INTAKE_CARD_VALIDATION_REPORT.md`
- `docs/launch/PILOT_DAY0_GO_NO_GO.md`
- `docs/launch/P4_PILOT_CLIENT_INTAKE.md`
