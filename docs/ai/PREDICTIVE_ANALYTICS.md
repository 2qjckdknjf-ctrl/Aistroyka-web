# Predictive Analytics

**Phase 12 — AI Platformization**  
**Delay prediction, budget overrun, contractor risk, schedule bottlenecks; explainable.**

---

## Delay prediction

- **Concept:** Estimate likelihood or magnitude of delay at project or task level using available signals: task due dates, completion status, report frequency, historical completion patterns (if we store completed_at).
- **Signals:** (1) Overdue tasks (already late). (2) Tasks due soon with no recent report or progress. (3) Ratio open/closed in last 7 days. (4) Optional: past project “planned end” vs actual (requires storing actual end or inferring from last activity).
- **Output:** Explainable indicator: e.g. “At risk of delay: 3 overdue tasks; no report in 5 days.” Or score (e.g. 0–100) with reason list. No single “delay date” prediction in v1 unless we have strong ground truth.
- **Method:** Rule-based first (overdue count, report gap). Optional simple ML (e.g. logistic regression on “delayed” vs “on time” per task/project) when we have enough outcome data. Always expose “why” (which tasks, which gaps).
- **Tenant-safe:** Model or rules use only that tenant’s data for tenant-specific view; industry benchmark (if any) uses anonymized flywheel data only.
- **Value:** Early warning; reallocation of effort; no replacement of PM judgment.

---

## Budget overrun prediction

- **Concept:** Flag risk of budget overrun. Core product has no budget/cost data today; prediction depends on integration (ERP) or optional budget fields.
- **If budget available:** Signals: planned vs actual (from ERP sync or manual), burn rate, % complete vs % spent. Output: “At risk: spend ahead of progress” with explanation. Rule-based (e.g. actual/planned > threshold) or simple regression.
- **If no budget:** Defer budget overrun to post-ERP (Phase 11). Document “budget overrun prediction requires budget/cost data (ERP or manual).”
- **Explainability:** Always: “X% spent vs Y% complete; typical overrun when …”
- **Value:** Only after finance data exists; high value for PMs and leadership.

---

## Contractor risk scoring

- **Concept:** Score “risk” or reliability of assignee/contractor based on observable behavior: on-time completion, report quality, response time, AI risk findings on their reports.
- **Signals:** Per assignee (or external contractor if we have identity): (1) Task completion rate (completed vs assigned). (2) Overdue rate. (3) Report submission frequency and recency. (4) Share of reports with high-risk AI finding. (5) Optional: time from assignment to first report. No subjective ratings in core.
- **Output:** Score (e.g. 0–100) or tier (e.g. low/medium/high risk) with reasons: “2 of 5 tasks overdue; 1 high-risk finding in last 10 reports.” Explainable; no black box.
- **Caveats:** Avoid bias (e.g. penalizing for difficult tasks); use for support and allocation, not automatic penalty. Tenant-only data; no cross-tenant comparison in product (benchmarks only in anonymized flywheel).
- **Value:** Allocation and support; early help for at-risk assignments.

---

## Schedule bottleneck detection

- **Concept:** Identify bottlenecks: tasks or projects that block progress or concentrate risk (many overdue, no activity, or many dependencies).
- **Signals:** (1) Tasks with many “blocked by” or in critical path (if we add dependencies). (2) Projects with zero or very low activity in last N days. (3) Concentrated overdue in one project or one assignee. (4) High volume of open tasks vs completed in a time window.
- **Output:** List of “bottleneck” items with reason: “Project P: 5 overdue tasks, no report in 7 days”; “Assignee A: 4 overdue tasks.” Rule-based; explainable.
- **Method:** Rules first. Optional graph-based (task dependencies) when we have dependency data. No heavy ML for v1.
- **Value:** Focus intervention; rebalance workload; unblock critical path.

---

## Implementation principles

- **Explainable AI:** Every prediction has a human-readable reason list. Prefer rules and simple models; avoid opaque deep learning for decisions.
- **No core domain rewrite:** Predictions are derived views or cached scores; optional new tables (e.g. project_health_snapshot, contractor_score). Core entities (project, task, report) unchanged.
- **Tenant-safe:** All inputs and outputs scoped by tenant. No cross-tenant model training in product; benchmarks via anonymization pipeline only.
- **Business value:** Each prediction maps to an action: “review,” “reallocate,” “request report,” “support contractor.” No prediction without clear use.
- **Ground truth:** Prefer to add optional outcome fields (e.g. task completed_at, project actual_end) to improve accuracy over time; start with rules and heuristics.
