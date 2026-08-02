# P4 — Pilot Success Metrics

**Date:** 2026-07-03  
**Phase:** P4 Task E  
**Review cadence:** Day 5 and end of Week 4

---

## Adoption metrics

| Metric | How to measure | Green | Yellow | Red |
|--------|----------------|-------|--------|-----|
| Active workers (week 1) | Distinct workers with ≥1 login | ≥80% of invited | 50–79% | <50% |
| Active managers | ≥1 login + ≥1 review | 100% of invited managers | 1 manager inactive | No manager active |
| Daily report completion | Reports submitted / worker-days | ≥70% days with report | 40–69% | <40% |
| Media per report | Reports with ≥1 photo / total reports | ≥80% | 50–79% | <50% |
| Manager review time (median) | submitted → reviewed timestamp | ≤24h | 24–48h | >48h |

---

## Operational value metrics

| Metric | How to measure | Green | Yellow | Red |
|--------|----------------|-------|--------|-----|
| Full loops completed | assign → report → review | ≥1 per worker | Partial (report only) | Zero loops |
| Missing evidence caught | Manager request-changes citing photos/notes | Qualitative + count | N/A | Reports approved without review habit |
| At-risk tasks flagged | Intelligence/ops signals used | Any useful signal | Not used | N/A |
| Approvals completed | Count approved + changes_requested | Matches submissions | Backlog growing | Queue ignored |
| Documents reviewed | If in scope: docs through review | Per plan | Delayed | Not used |
| Stakeholder portal views | Sponsor opens portal ≥1/week | Yes | Forgot | Wrong data shown (**P0**) |

---

## Reliability metrics

| Metric | How to measure | Green | Yellow | Red |
|--------|----------------|-------|--------|-----|
| Login success | Support tickets / login attempts | No P0 auth | Isolated 401 | Widespread auth failure |
| Upload success | Stuck pending uploads | 0 stuck >30 min (online) | 1–2 recoverable | Repeated failures |
| Sync success | Worker diagnostics / support | Self-recover offline | Manual refresh needed | Data not appearing |
| Crash / blocker count | User reports + diagnostics | 0 P0 | 1 P1 | Any P0 unresolved >4h |
| Support tickets | Count by severity | P3 only | P2 manageable | Any open P0 |

---

## Business metrics

| Metric | How to measure | Green | Yellow | Red |
|--------|----------------|-------|--------|-----|
| Client satisfaction | Day 5 survey / call (1–5) | ≥4 | 3 | ≤2 |
| Manager willingness to continue | Explicit yes/no | Yes | Conditional | No |
| Worker usability | Informal feedback | Can submit without help | Needs daily help | Refuses app |
| Conversion signal | Sponsor asks for expansion/pricing | Interest | Neutral | No value seen |
| Paid pilot readiness | Owner assessment | Ready to discuss | Needs fixes | Not ready |

---

## Week 1 decision matrix

| Overall | Condition | Decision |
|---------|-----------|----------|
| **Green** | Majority green; no open P0; ≥1 loop per worker | **Continue** weeks 2–4 |
| **Yellow** | Mixed; P1 issues with workarounds | **Continue with fixes** + extra CS touch |
| **Red** | Any P0 unresolved OR zero loops OR sponsor stop | **Pause** — retro + owner decision |

---

## Data collection (operator)

| Source | Fields |
|--------|--------|
| Dashboard / API | Report counts, approval timestamps |
| Support log | Ticket severity, request_id |
| Call notes | Qualitative satisfaction |
| TestFlight | Build number (2026063001) on all devices |
| Secure sheet | Daily counts (manual if analytics not wired) |

**Note:** Full product analytics may be partial — manual counts acceptable for first pilot.

---

## Related docs

- `docs/growth/GROWTH_KPI_FRAMEWORK.md`
- `docs/pilot/RELIABILITY_METRICS_AND_KPIS.md`
- `docs/launch/P4_FIRST_WEEK_OPERATING_PROTOCOL.md`
