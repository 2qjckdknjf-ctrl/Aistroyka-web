# P4 — Pilot Client / Project Intake

**Date:** 2026-07-03 (Day 0 execution)  
**Operator use:** Store credential copies in secure CRM/sheet — **do not commit PII to git**.

**Intake status:** **OPEN — REQUIRED FIELDS MISSING**  
**Launch impact:** **NO-GO** until §1–§2 required fields and §7 sign-off are complete.

**Preferred artifact (2026-07-03):** Use the structured intake system:

| Artifact | Path |
|----------|------|
| Fillable intake card | [`PILOT_INTAKE_CARD.md`](./PILOT_INTAKE_CARD.md) |
| Empty JSON template | [`pilot-intake.template.json`](./pilot-intake.template.json) |
| Safe demo example | [`pilot-intake.example.json`](./pilot-intake.example.json) |
| Local validator | `node scripts/pilot/validate_pilot_intake.mjs <intake.json>` |

Copy the template to a **gitignored** local file (e.g. `pilot-intake.local.json` outside commit path) for real client data.

---

## 1. Client / company

| Field | Value | Status |
|-------|-------|--------|
| Company name | **MISSING** | Owner must provide |
| Primary contact (name) | **MISSING** | Pilot sponsor |
| Phone | **MISSING** | |
| Email | **MISSING** | Primary support thread with client |
| Secondary contact | **MISSING** | Optional |
| Preferred language | **MISSING** (default assumption: `ru`) | Operator sets after sponsor confirms |
| Timezone | **MISSING** | |
| Pilot start date (Day 0) | **MISSING** | Cannot schedule kickoff |
| Expected duration | **4 weeks** (default until client confirms) | Assumed |
| Industry / use case | **MISSING** | e.g. construction / renovation |
| **Support contact (AISTROYKA → client)** | **MISSING** | Owner must assign pilot inbox before brief send |

---

## 2. Project

| Field | Value | Status |
|-------|-------|--------|
| Project name | **MISSING** | |
| Site address / location | **MISSING** | Optional but recommended |
| Project type | **MISSING** | |
| Number of workers (field) | **MISSING** (target 2–15) | Minimum 2 for pilot |
| Number of managers | **MISSING** (target 1–5) | Minimum 1 |
| Client / stakeholder users | **MISSING** (count + roles) | Default: 0–1 `client_viewer` week 1 |
| iOS devices available | **MISSING** (count + models) | **Required** for field workers |
| Site internet quality | **MISSING** (default assume: Mixed) | |
| **Android-only workers** | **NO** (program default; **client not yet confirmed**) | See Day 0 Android check |
| Critical workflows for pilot | **Default:** assign → report (photos) → manager review → stakeholder progress view | Confirm with sponsor |

---

## 3. Data to prepare (operator checklist)

| Data type | Needed for pilot? | Status |
|-----------|-------------------|--------|
| Initial tasks (5–30) | **Yes** | **BLOCKED** — no client project |
| Milestones | Optional | N/A |
| Documents / acts / contracts | Optional | N/A |
| Cost / budget baseline | Optional (internal only) | N/A |
| Existing photos / reports | Optional | N/A |

---

## 4. Eligibility decision

### Web + iOS pilot eligible when ALL true:

- [ ] Clear **assign → do → report → review** loop — **assumed OK** (product closed P1/P2)
- [ ] At least **1 manager + 2 workers** committed — **MISSING**
- [ ] **iOS devices** for field workers — **MISSING**
- [ ] **Android-only field team: NO** — **assumed YES** (unconfirmed)
- [ ] Decision-maker identified — **MISSING**
- [ ] Pilot sponsor accepts pilot limitations — **MISSING**
- [ ] Data sensitivity acceptable — **MISSING**

| Decision | Value |
|----------|-------|
| Client eligible for web + iOS pilot | **UNKNOWN** — intake incomplete |
| Blockers resolved | **NO** |
| **Launch allowed from intake gate** | **NO** |

---

## 5. Blockers register (Day 0)

| Blocker | Blocks launch? |
|---------|----------------|
| No company name / sponsor / contact email | **YES** |
| No pilot start date | **YES** |
| No worker/manager counts | **YES** |
| No iOS device confirmation | **YES** |
| No owner + client sign-off (§7) | **YES** |
| Production pilot tenant not owner-authorized | **YES** (staging dry-run only executed) |
| Physical TestFlight device smoke not executed | **YES** for client kickoff |

---

## 6. Owner / client input needed (Day 0)

| Question | Blocks launch? | Safe default |
|----------|----------------|--------------|
| Company + sponsor + email + phone | **YES** | None |
| Project name + address | **YES** | None |
| Workers / managers count | **YES** | None |
| iOS devices for all field workers | **YES** | None |
| Android-only workers? | **YES** if YES | **NO** (P3 defer) |
| Production vs staging for live pilot | **YES** | Staging dry-run done; production needs owner **YES** |
| Support email for client brief | **YES** | `pilot-support@aistroyka.ai` (owner confirms) |
| Preferred language | No | `ru` |

---

## 7. Sign-off

| Role | Name | Date | Signature / APPROVED |
|------|------|------|----------------------|
| Owner (AISTROYKA) | **MISSING** | | |
| Client pilot sponsor | **MISSING** | | |

---

## Day 0 operator note

Staging platform smoke **PASS** (2026-07-03) — see `PILOT_DAY0_STAGING_DRY_RUN.md`.  
**No dedicated client tenant** provisioned — client identity not supplied.

---

## Related docs

- `docs/launch/PILOT_INTAKE_CARD.md`
- `docs/launch/pilot-intake.template.json`
- `docs/launch/pilot-intake.example.json`
- `docs/launch/PILOT_INTAKE_CARD_VALIDATION_REPORT.md`
- `docs/launch/PILOT_DAY0_GO_NO_GO.md`
- `docs/mobile/P3_ANDROID_DEFER_DECISION.md`
- `docs/growth/PILOT_CLIENT_SELECTION.md`
