# Construction Copilot

**Phase 12 — AI Platformization**  
**Manager dashboard copilot: summaries, recommendations, alerts, weekly plan.**

---

## Manager dashboard copilot

- **Concept:** A copilot layer on the manager dashboard that consumes existing API data (projects, tasks, reports, media, AI analysis results) and presents concise summaries, action recommendations, priority alerts, and a weekly plan. No new core entities; read-only aggregation and optional LLM summarization.
- **Placement:** UI component or panel on dashboard; can be toggled by tenant (feature flag). Backend: optional endpoint or server component that aggregates and, if needed, calls LLM with tenant-scoped context. All data scoped by tenant; no cross-tenant access.
- **Value:** Reduces time to “what’s going on”; surfaces what needs attention; augments, not replaces, manager judgment.

---

## Project health summaries

- **Inputs:** Per project: task counts (open, overdue, completed), report count and last report date, recent AI analysis (e.g. high-risk media count, last 7 days). Optional: assignee distribution, media volume.
- **Output:** Short text summary per project: e.g. “3 overdue tasks; 2 reports this week; 1 high-risk finding on photos.” Optionally LLM-generated one-liner. Plus structured health indicators: traffic-light (green / amber / red) or score (0–100) from rules (e.g. overdue > 0 → amber; no report in 7 days → amber).
- **Explainability:** Each indicator derived from clear rules (e.g. “Overdue: 3 tasks past due date”). No black box; document rule set in product docs.
- **Refresh:** On dashboard load or on interval (e.g. 5 min); no real-time push required for v1.

---

## Action recommendations

- **Source:** From same aggregates: “Close overdue task X”; “Request report for project Y (no report in 5 days)”; “Review high-risk photo in report Z.” Stored as list of recommendation objects: type, project_id, task_id or report_id, reason text, priority (e.g. high/medium/low).
- **Logic:** Rule-based first: overdue tasks → “close or reschedule”; no recent report → “request report”; high-risk analysis on media → “review finding.” Optional LLM to rank or phrase; ranking must remain explainable (e.g. “because 3 overdue”).
- **UI:** List or cards with deep link to task/report; dismiss or “done” to hide. No automatic application of actions; manager confirms.
- **Value:** Focuses attention; reduces missed follow-ups.

---

## Priority alerts

- **Types:** (1) Overdue tasks (count or list). (2) No report for N days on active project. (3) High-risk AI finding (risk_level high on recent analysis). (4) Optional: threshold on “many open tasks” or “no activity in 7 days.” All from existing data; no new event stream required.
- **Delivery:** In-dashboard alert strip or bell; optional future: email/push (reuse existing notification path). Per tenant; configurable thresholds (e.g. N = 5 days) in tenant settings or feature flags.
- **Explainability:** Each alert has reason: “Project P has 2 overdue tasks” with links. No opaque scoring.
- **Value:** Early warning without replacing manager responsibility.

---

## Weekly plan generator

- **Input:** Current user (manager); their projects; tasks due this week or overdue; report gaps; recommendations. Optional: calendar or working days.
- **Output:** “This week” view: (1) Tasks to close or reschedule (overdue + due this week). (2) Reports to request (by project). (3) Items to review (high-risk or flagged). Ordered by priority (e.g. overdue first, then due soon). Optionally LLM-generated short narrative (“Focus on finishing X and collecting report for Y”).
- **Refresh:** On load or when “Refresh plan” clicked. No automatic scheduling of work; suggestion only.
- **Value:** One place for weekly focus; less cognitive load.

---

## Implementation principles

- **No core domain rewrite:** Copilot reads projects, tasks, reports, media, ai_analysis via existing API or server-side queries. No new tables required for v1 (optional: cache table for precomputed health or recommendations).
- **Tenant-safe:** All aggregation filtered by tenant_id (and optional user’s accessible projects). No cross-tenant data.
- **Explainable:** Rules and thresholds documented; every summary and alert traceable to data. Prefer rules; use LLM for phrasing only where helpful.
- **Augment, not complicate:** Optional panel; can be off by default or behind feature flag. Does not block core dashboard usage.
- **Privacy-safe:** No PII in prompts; use IDs and counts. Policy engine applies if any user content is sent to LLM.
