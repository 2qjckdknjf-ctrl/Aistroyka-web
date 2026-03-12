# Pilot Rollout Playbook

**Phase 8 — Pilot Rollout & Growth**  
**Operational playbook for onboarding and running a pilot tenant.**

---

## Tenant provisioning checklist

- [ ] **Environment:** Staging or production agreed; API URL and app builds point to correct env.
- [ ] **Tenant record:** Created in system (tenant id; owner = pilot sponsor or designated owner).
- [ ] **Owner account:** Email verified; can sign in to web dashboard.
- [ ] **Subscription/tier:** Set to pilot tier (e.g. Free or pilot-specific tier); limits documented in PRICING_AND_PACKAGING.
- [ ] **Projects:** At least one project created; name and settings correct.
- [ ] **Tasks:** 5–15 tasks created under project(s); status open/assigned; assignable to workers.
- [ ] **Invitations:** Sent to all managers and workers (invite flow); roles set (admin/member for managers).
- [ ] **Mobile:** TestFlight (iOS) / internal track (Android) link shared; API base URL correct in build.
- [ ] **Support:** Primary contact and escalation contacts (see below) shared; support channel (email/chat) live.

---

## Roles / users setup

| Role | Count | Action |
|------|--------|--------|
| Owner | 1 | Tenant creator or transferred; has full access. |
| Admin/Manager | 1+ | Invite with role admin or member; can assign tasks and review reports. |
| Worker | 2+ | Invite with role member (or worker role if applicable); can receive tasks and submit reports. |
| Viewer | Optional | Invite with role viewer for read-only stakeholders. |

- **Rule:** At least one owner; at least one manager and two workers for meaningful pilot.
- **Document:** List of pilot users (names/emails) and roles in secure sheet or CRM; do not commit to repo.

---

## Demo data seeding

- **Staging:** Use Supabase dashboard or idempotent script to create tenant, projects, tasks. Optionally seed sample reports for demo.
- **Production pilot:** Prefer real project names and real tasks; no fake PII. Minimal seed: 1 project, 5–10 tasks.
- **Demo environment:** Separate tenant or staging with full demo dataset (multiple projects, tasks, sample reports) for sales demos (see DEMO_AND_SALES_KIT).
- **Reproducibility:** Document steps (“Create tenant → Add project X → Add tasks Y, Z…”) so second pilot can be provisioned the same way.

---

## Manager onboarding steps

1. **Invite:** Send invite link; recipient accepts and sets password (if first time).
2. **Sign in:** Manager signs in to web dashboard and/or iOS Manager.
3. **Tour (5 min):** Show Dashboard, Projects, Tasks, Reports inbox, Team. Point to Settings / Diagnostics.
4. **First action:** Manager assigns one task to a worker; confirms worker sees it (worker app or ask worker).
5. **Second action:** When first report is submitted, manager opens report and performs review (approve / request changes).
6. **Check:** Manager knows how to open Diagnostics/Settings and where to find support contact.
7. **Milestone:** “Manager has assigned ≥1 task and reviewed ≥1 report” = manager activated.

---

## Worker onboarding steps

1. **Invite or sign-up:** Worker has account; receives invite or registers (per tenant policy).
2. **Install:** Worker installs iOS Worker (or Android) from TestFlight/internal link; opens app.
3. **Sign in:** Worker signs in; selects or is assigned project.
4. **Tour (3 min):** Show Today’s tasks, Start shift, New report, Sync status. Point to Support (Diagnostics).
5. **First action:** Worker starts shift; creates and submits one report (with photo if applicable).
6. **Check:** Worker sees report in “submitted” state; no stuck “pending upload” for > few minutes (if online).
7. **Milestone:** “Worker has submitted ≥1 report” = worker activated.

---

## First-week success milestones

| Day | Milestone | Owner |
|-----|-----------|--------|
| **Day 0** | Tenant provisioned; invites sent; apps installed by at least 1 manager + 2 workers | Ops |
| **Day 1** | All pilot users signed in at least once | Ops / CS |
| **Day 3** | ≥1 task assigned; ≥1 report submitted; ≥1 report reviewed | Pilot + CS |
| **Day 5** | Check-in call: blockers, feedback, usage | CS |
| **Day 7** | First-week summary: logins, tasks assigned, reports submitted, reviews; any incidents | CS |

**Pilot success score (Week 1):** See GROWTH_KPI_FRAMEWORK. Target: activation rate > 50%; at least one full loop (assign → report → review) per pilot.

---

## Escalation contacts

| Level | Role | When |
|-------|------|------|
| **L1** | Customer Success / Support | First response; triage; FAQs; diagnostics collection. |
| **L2** | Product / Engineering | Bug confirmation; request_id lookup; workaround or fix. |
| **L3** | Principal / On-call | Outage; data issue; security; pilot-blocking incident. |

**Document for pilot:** Single support email or chat; expected response time (e.g. 24h business); when to include request_id and app version (see CUSTOMER_SUCCESS_SYSTEM).

---

## Pilot timeline (Week 0–4)

| Week | Focus | Activities |
|------|--------|------------|
| **Week 0** | Prep & provisioning | Client selection signed off; tenant created; invites sent; apps distributed; kickoff call. |
| **Week 1** | Activation | Onboarding completed; first assign/report/review loop; Day 3 and Day 7 check-ins; collect first feedback. |
| **Week 2** | Habit & value | Daily or near-daily use; review turnaround time measured; second feedback round; troubleshoot any blockers. |
| **Week 3** | Stabilize & expand | Optional: add more tasks or workers; demo to stakeholder; refine FAQs from real questions. |
| **Week 4** | Review & next | Pilot retro: success metrics, feedback summary, expansion readiness; decide renew/expand/exit. |

**Deliverables by end of Week 4:** Pilot success score; feedback log (bugs, UX, features); decision on next steps (scale, iterate, or pause).
