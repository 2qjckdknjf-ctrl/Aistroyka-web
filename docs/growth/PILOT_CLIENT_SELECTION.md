# Pilot Client Selection Framework

**Phase 8 — Pilot Rollout & Growth**  
**Purpose:** Choose pilot tenants that maximize learning and minimize risk while delivering real value.

---

## Ideal pilot profile

- **Industry:** Construction, field services, or similar where workers complete tasks and submit reports (photos, notes) and managers assign work and review submissions.
- **Workflow fit:** Assign task → worker performs → worker submits report → manager reviews. Willing to use mobile (iOS Worker) for field and web or iOS Manager for office.
- **Mindset:** Early adopter; accepts that some rough edges exist; committed to giving structured feedback (bugs, UX, feature requests) in exchange for influence and support.
- **Outcome focus:** Cares about visibility (who did what, when), faster review turnaround, and fewer missed or duplicate reports—not only feature checklist.

---

## Size range

| Dimension | Recommended range | Rationale |
|-----------|-------------------|-----------|
| **Managers** | 1–5 | Enough to validate task-assign and review flows; not so many that support is diluted. |
| **Workers** | 2–15 | Enough for sync and notification load; representative of small team. |
| **Projects** | 1–5 | At least one project; multiple if pilot wants to test project switching. |
| **Tasks (active)** | 5–30 | Enough to drive report volume and review workload. |

**Sweet spot:** One team lead (manager) and 3–8 workers, 1–2 projects, 10–20 tasks in first 2 weeks.

---

## Use-case fit

- **Strong fit:** Daily task assignment; daily or near-daily report submission; manager reviews within 24–48 hours; need for photo evidence and simple status (done / changes requested).
- **Partial fit:** Less frequent reports (e.g. weekly); still valuable for audit trail and AI-assisted review when used.
- **Poor fit:** No clear “assign → do → report → review” loop; purely document storage; or requirement for heavy customization before first use.

**Check:** Can the pilot describe “a typical week” with tasks and reports? If yes, fit is good.

---

## Technical readiness

- **Web:** Modern browser (Chrome, Safari, Edge); ability to receive and open invite links; cookies/session allowed.
- **iOS:** Devices on supported iOS version; TestFlight install (or App Store if pilot build is public); push notifications optional but recommended.
- **Android:** If pilot uses Android workers, devices ready for internal build or Play internal testing.
- **Network:** Field workers may have intermittent connectivity; app supports offline queue and sync—pilot should know to expect sync when back online.
- **No requirement:** On-prem deployment, VPN, or custom SSO for initial pilot (can be roadmap).

**Check:** Confirm at least one manager and one worker have compatible devices and can install the app.

---

## Decision-maker access

- **Owner or budget holder** is identified and has agreed to pilot (even if free/discounted).
- **Single point of contact** for pilot: one person (e.g. manager or ops) who can coordinate onboarding, collect feedback, and escalate.
- **Stakeholder alignment:** If multiple departments (e.g. operations + IT), one decision-maker is pilot sponsor and can unblock issues.

**Check:** We have name and contact for pilot sponsor and primary contact.

---

## Risk assessment

| Risk | Mitigation |
|------|-------------|
| **Low engagement** | Set clear first-week milestones (e.g. 5 reports submitted); check-in call at Day 3 and Day 7. |
| **Wrong use case** | Use selection criteria above; disqualify if no “assign → report → review” loop. |
| **Data sensitivity** | Prefer pilot with non-sensitive sites or anonymized data for first weeks; document data handling in pilot agreement. |
| **Scope creep** | Fixed pilot scope (e.g. one team, 4 weeks); feature requests go to backlog, not mid-pilot build. |
| **Single point of failure** | At least 2 managers or 2 workers so one dropout doesn’t kill pilot. |
| **Support overload** | Define SLA (see CUSTOMER_SUCCESS_SYSTEM); cap pilot count until support capacity is proven. |

**Go/no-go:** Proceed only if use-case fit, technical readiness, and decision-maker access are confirmed; size is within range; risks are accepted and mitigated.

---

## Decision log

- **Selection criteria** (this document) approved by: _______________  
- **First pilot candidate** approved: _______________  
- **Pilot start date** (Week 0): _______________
