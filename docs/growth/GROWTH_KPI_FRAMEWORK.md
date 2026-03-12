# Growth KPI Framework

**Phase 8 — Pilot Rollout & Growth**  
**Metrics for pilot success and scale readiness.**

---

## Activation rate

- **Definition:** % of invited users (or signed-up users) who complete activation within 7 days of first login.
- **Activation:** Manager = has assigned ≥1 task OR reviewed ≥1 report. Worker = has submitted ≥1 report.
- **Formula:** (Activated users in cohort / Users with at least one login in cohort) × 100, within 7 days.
- **Target (pilot):** > 50% for invited pilot users.
- **Source:** Product events (login_success, task_assigned, report_submitted, report_reviewed) per PRODUCT_ANALYTICS_PLAN.

---

## Weekly active managers (WAM)

- **Definition:** Distinct managers (role admin or owner or member in manager context) with at least one relevant event in the calendar week (login_success, task_assigned, report_reviewed, ai_analysis_used).
- **Relevance:** Indicates manager engagement and review capacity.
- **Target (pilot):** WAM ≥ 1 per pilot tenant each week; growth as more managers onboard.

---

## Weekly active workers (WAW)

- **Definition:** Distinct workers with at least one relevant event in the calendar week (login_success, report_submitted).
- **Relevance:** Indicates field adoption.
- **Target (pilot):** WAW ≥ 2 per pilot tenant each week (or 100% of invited workers in small pilot).

---

## Reports per project

- **Definition:** Count of reports submitted (report_submitted) per project in a period (e.g. week or month).
- **Relevance:** Usage intensity and value per project.
- **Target (pilot):** ≥ 1 report per project per week in active pilots.

---

## Review turnaround time

- **Definition:** Time from report_submitted to report_reviewed for the same report (median or p90 per tenant/week).
- **Relevance:** Manager responsiveness; core value promise (“faster review”).
- **Target (pilot):** Median < 24–48 hours where possible; track and share with pilot.

---

## Pilot success score

- **Definition:** Composite for a single pilot tenant at end of Week 4 (or end of pilot).
- **Components (equal or weighted):**  
  - Activation rate (e.g. ≥ 50% = 1, else 0).  
  - At least one full loop (assign → report → review) per week in 2 of 4 weeks.  
  - No P0/P1 unresolved for > 48 hours.  
  - At least one structured feedback round (survey or call) completed.
- **Score:** e.g. 0–4; “success” = ≥ 3. Adjust weights as needed.
- **Use:** Go/no-go for expansion; input to case study or reference.

---

## Expansion readiness score

- **Definition:** Readiness of a pilot (or early customer) to expand (more users, more projects, or paid conversion).
- **Signals:**  
  - Pilot success score ≥ 3.  
  - WAM and WAW stable or growing in last 2 weeks.  
  - Positive feedback and no critical open bugs.  
  - Decision-maker expressed interest in expanding or converting.
- **Use:** Prioritize which pilots to convert or expand; feed into sales/CS playbook.

---

## Summary table

| Metric | Definition | Target (pilot) |
|--------|------------|----------------|
| Activation rate | % users activated within 7 days | > 50% |
| WAM | Weekly active managers | ≥ 1 per tenant |
| WAW | Weekly active workers | ≥ 2 per tenant |
| Reports per project | Reports per project per week | ≥ 1 |
| Review turnaround | Median time submit → review | < 24–48 h |
| Pilot success score | Composite (activation, loop, incidents, feedback) | ≥ 3 of 4 |
| Expansion readiness | Signals for expand/convert | Qualitative + score |

**Reporting:** Weekly during pilot (WAM, WAW, reports, turnaround); pilot success and expansion readiness at end of pilot.
