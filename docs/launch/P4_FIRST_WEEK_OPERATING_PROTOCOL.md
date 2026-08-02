# P4 — First Week Operating Protocol

**Date:** 2026-07-03  
**Phase:** P4 Task D  
**Pilot path:** Web dashboard + iOS Worker + iOS Manager (TestFlight **2026063001**) + stakeholder portal. **Android out of scope.**

---

## Roles

| Role | Person | Responsibility |
|------|--------|----------------|
| **Pilot lead (AISTROYKA)** | Owner / CS | Kickoff, GO/NO-GO, client relationship |
| **Operator** | Ops | Tenant/project setup, smoke, credential hygiene |
| **CS / Support (L1)** | Support | Day 1–5 check-ins, ticket triage |
| **Engineering (L2)** | On-call | P0/P1 incidents, request_id lookup |
| **Client sponsor** | Client | Decisions, user availability, feedback |
| **Client manager** | Client | Task assign, report review daily |
| **Client workers** | Client | Field reports + photos |

---

## Day 0 — Setup and walkthroughs

**Owner:** Operator + CS (2–3 hours)

| Time | Activity | Evidence |
|------|----------|----------|
| AM | Complete intake + GO/NO-GO checklist | Signed checklist |
| AM | Staging dry-run (if not done) | Smoke log saved |
| PM | Production tenant + project live | Tenant/project IDs recorded |
| PM | Send invites; confirm acceptances | All roles accepted |
| PM | **TestFlight:** Worker + Manager installed on iOS devices | Screenshot or verbal confirm |
| PM | **Manager walkthrough** (15 min web): projects, tasks, approvals, documents | Manager assigns 1 task |
| PM | **Worker walkthrough** (10 min iOS): shift, task, report, photo, submit | 1 test report submitted |
| PM | **Stakeholder walkthrough** (10 min portal): what client can see | Sponsor confirms boundaries |
| EOD | Share support email + severity guide | Email sent |

**Day 0 checklist:**

- [ ] All accounts active
- [ ] TestFlight working on ≥1 worker phone
- [ ] Manager can open dashboard
- [ ] Stakeholder portal login (if applicable)
- [ ] Support channel confirmed

---

## Day 1 — First real loop

**Owner:** Client manager + CS check-in

| Step | Who | Expected |
|------|-----|----------|
| 1 | Each worker | Submit **≥1 real report** with photos on assigned task |
| 2 | Manager | Review **≥1 report** (approve or request changes) |
| 3 | Operator/CS | Confirm upload + approval in dashboard |
| 4 | Stakeholder | Open portal — see approved/safe progress only |
| 5 | CS | 15-min call or async check: blockers? | Log issues |

**Evidence to capture:**

- Report IDs (short form in operator log)
- Screenshot of manager approval (optional, client consent)
- Any `request_id` from errors

**Escalate P0/P1 same day** — see `P4_SUPPORT_INCIDENT_RUNBOOK.md`.

---

## Days 2–4 — Daily operating rhythm

**Daily expectation:**

| Role | Daily action |
|------|--------------|
| Workers | Submit reports for active tasks (target: **≥1 report/worker/day** or agreed cadence) |
| Manager | Clear approval queue within **24–48h** |
| Sponsor | Surface blockers to CS |
| CS | Log issues; **Day 3** sync call (30 min) |

**Manager daily checklist:**

- [ ] Open approvals / reports inbox
- [ ] Review new submissions
- [ ] Assign or update tasks for tomorrow
- [ ] Check documents pending review (if in scope)

**Worker daily checklist:**

- [ ] Start shift
- [ ] Complete assigned tasks
- [ ] Submit report with photos before end of day
- [ ] Sync if offline (pull to refresh / reopen app)

**Operator/CS daily checklist:**

- [ ] Review support inbox
- [ ] Classify incidents P0–P3
- [ ] Update issue log with tenant_id, build, request_id
- [ ] No product fixes unless launch blocker (minimal/safe only)

**Document/cost/schedule review (optional mid-week):**

- Manager updates milestones or cost lines **internal only**
- Confirm stakeholder still sees no internal finance

---

## Day 5 — Pilot review

**Owner:** Pilot lead + client sponsor (45–60 min)

**Agenda:**

1. Metrics review (`P4_PILOT_SUCCESS_METRICS.md`)
2. What worked / what failed
3. Open incidents and status
4. Client feedback (structured)
5. Decision: **continue / extend / pause / stop**

**Deliverables:**

- Completed week-1 scorecard (green/yellow/red)
- Feedback log entries
- Decision recorded in operator sheet

---

## Escalation path (week 1)

```
User issue → L1 Support (email)
  → P0/P1 within SLA → L2 Engineering
  → outage / data / security → L3 Owner/on-call
```

**Do not** ask users for passwords or full JWT tokens.

---

## Daily operator checklist (copy/paste)

```
Date: ___________
Pilot: ___________
Environment: staging | production

[ ] Health check OK (buildStamp noted)
[ ] New support tickets triaged
[ ] Workers submitted reports (count: ___)
[ ] Manager reviews completed (count: ___)
[ ] Incidents: P0 ___ P1 ___ P2 ___
[ ] Client contact done (Y/N)
[ ] Notes:
```

---

## Related docs

- `docs/launch/P4_PILOT_SUCCESS_METRICS.md`
- `docs/launch/P4_SUPPORT_INCIDENT_RUNBOOK.md`
- `docs/growth/PILOT_ROLLOUT_PLAYBOOK.md`
