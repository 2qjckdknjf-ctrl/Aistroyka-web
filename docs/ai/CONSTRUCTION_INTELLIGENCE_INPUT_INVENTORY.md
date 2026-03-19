# Construction Intelligence — Input Inventory

**Date:** 2026-03-19  
**Scope:** Real signals used by the manager-facing intelligence layer (missing evidence, top risks, executive summary, project health).

---

## 1. Recent reports

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Report coverage (submitted/missing per day) | `report-intelligence.service` → `worker_day`, `worker_reports` | High | High | high | None |
| Report signals (submitted, missing) | Same | High | High | high | day_id only; no report body content |
| Missing report count (last 7d) | Same, `sinceDays: 7` | High | High | high | — |

---

## 2. Photo / evidence

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Task required_photos vs actual media | `evidence-intelligence.service` → `worker_tasks`, `worker_report_media`, `upload_sessions` | High | High | high | required_photos schema varies (object vs count) |
| Before/after (report_before, report_after) | Same, upload_sessions.purpose | High | High | high | Only when required_photos has before/after |
| Evidence staleness (no media in 14d + recent activity) | `evidence-staleness.service` → `media`, `worker_reports`, `worker_tasks` | Medium | High | medium | Thresholds fixed (14d stale, 7d activity) |
| Media count per project | `snapshot.mapper` → `media` | High | Medium | high | — |

---

## 3. Report completeness / missing evidence indicators

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Partial evidence (actual < required) | evidence-intelligence | High | High | high | — |
| Before/after gap | evidence-intelligence | High | High | high | — |
| Stale evidence | evidence-staleness | Medium | High | medium | Heuristic (activity window) |
| Missing report days | report-intelligence | High | High | high | — |
| Reports without media | report-quality.service | High | Medium | high | — |

---

## 4. Blocked / overdue tasks

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Overdue tasks | `task-signals.mapper` → `worker_tasks` (due_date < today, status not done) | High | High | high | — |
| Blocked (inferred) | Same: overdue + in_progress + no recent report | Medium | High | medium | Inferred, not explicit status |
| Overdue count | snapshot.mapper | High | High | high | — |
| Completed count | snapshot.mapper | High | Medium | high | — |

---

## 5. Approvals / documents (if useful)

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| — | Not wired into intelligence layer | — | Low for this phase | — | Document/approval signals could be added later |

---

## 6. Budget / variance (if useful)

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Cost risk signals | `cost-signals.service` | Medium | Medium | medium | Depends on cost data presence |
| Budget overrun / cost pressure | risk-intelligence (aggregates cost-signals) | Medium | Medium | medium | — |

---

## 7. Recommendation / health / snapshot structures

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Project snapshot | `snapshot.mapper` → project-summary, worker_tasks, media, analysis_jobs | High | High | high | openReportCount semantics |
| Project health (v1) | `project-health.service` | Medium | High | medium | Uses strategic risk / delay prob (if present) |
| Project health (v2) | `project-health-v2.service` (overdue, no reports, combo penalty) | High | High | high | Transparent formula |
| Explicit project risks | `project-risks.repository` | High if present | High | high | Table may be empty |
| Milestone pressure | `milestone-pressure.service` | High | High | high | — |
| Schedule pressure | `schedule-pressure.service` | Medium | Medium | medium | Inferred from overdue concentration |

---

## 8. Issue / risk-like signals

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| RiskSignal (overdue, blocked, delay, missing_evidence, report_quality, milestone_overdue, cost) | risk-intelligence.service (aggregates mappers + services) | High | High | high | manual/ai_analysis sources if not populated |

---

## 9. Timeline / schedule-like signals

| Signal | Source | Data quality | Usefulness | Confidence | Gaps |
|--------|--------|--------------|------------|------------|------|
| Milestone overdue / at risk | milestone-pressure.service | High | High | high | — |
| Overdue task concentration | schedule-pressure.service | Medium | Medium | medium | Heuristic |

---

## 10. Major missing inputs (gaps)

- **Explicit “blocked” status:** Blocked is inferred (overdue + in progress + no recent report), not a first-class task status.
- **Report body / narrative:** Only submission status and day coverage; no text analysis in this layer.
- **Document/approval state:** Not fed into intelligence; could improve “friction” factor later.
- **Schedule baseline:** No baseline schedule or planned dates beyond task due_date and milestones; delay is inferred from overdue/reports.
- **AI analysis content:** analysis_jobs count used; no structured “findings” in health/risk yet.
