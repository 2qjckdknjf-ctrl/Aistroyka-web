# Phase 12 AI Platform Audit

**Phase 12 — AI Platformization (MAX)**  
**Chief AI Platform Architect**  
**Available data signals, AI-ready workflows, ROI areas, data quality risks, maturity roadmap.**

---

## Available data signals

- **Structured:** Projects (name, status, dates); tasks (title, status, due, assignee); reports (body, status, created_at, media); media (url, type, linked to report); tenants and users. Stored in Supabase; queryable via API and RPC. No ERP/BIM linkage in core yet (see Phase 11).
- **AI-derived today:** Vision analysis per media: stage, completion_percent, risk_level, detected_issues, recommendations (AnalysisResult). Stored in ai_analysis or equivalent; linked to report/media. Used for single-image insight; not yet aggregated across project or time.
- **Temporal:** Task due dates, report timestamps, media upload time. Sufficient for delay and progress-over-time analysis if we aggregate.
- **Missing or thin:** Budget/cost (no finance in core); contractor performance history (only assignee_id); schedule (tasks have due dates but no critical path); defect taxonomy (free-text in issues); formal quality grades. These limit predictive and benchmarking accuracy until we add or integrate.

---

## AI-ready workflows

- **Photo analysis (in place):** Upload → job enqueue → AI vision (AIService / construction-brain) → AnalysisResult stored. Augments report; does not change core report/task domain. Ready to extend with more structured outputs (defect codes, before/after).
- **Manager dashboard:** Read-only aggregation of projects, tasks, reports, and AI results. No AI in dashboard today; ready for copilot layer (summaries, recommendations, alerts) that consumes existing API data + AI results.
- **Report creation:** Worker submits report + media; AI runs on media. Ready for auto-doc: same signals + optional LLM step to generate narrative or executive summary from report + analysis.
- **Project view:** Project + tasks + reports + media. Ready for health score, delay prediction, and weekly plan if we add aggregation and light ML or rules.

---

## Highest ROI automation areas

1. **Manager copilot (dashboard):** Project health summaries, priority alerts, “what to do this week” from tasks and overdue items. Uses existing data; no new ingestion. High visibility; augments daily decisions. ROI: time saved, fewer missed deadlines.
2. **Photo progress and quality (extend current vision):** Already running; extend with progress detection (completion % over time), defect/quality tags, before/after. Directly tied to field evidence; reduces manual review. ROI: faster QA, better documentation.
3. **Auto documentation:** Daily report narrative, work completion acts, executive summary from report + media + analysis. Reuses report and AI result; one LLM pass per report or per day. ROI: less admin work, consistent briefings.
4. **Delay and bottleneck signals (predictive):** Simple rules or light ML on task due vs completed, report frequency, overdue count. Explainable (“3 tasks overdue; no report in 5 days”). ROI: early warning without replacing PM judgment.
5. **Digital twin readiness:** Link tasks, media, reports (and optional BIM) by time; expose time-layered view and progress timeline. Enables “as-built” story and future twin integration. ROI: differentiation, partner readiness.

---

## Data quality risks

- **Sparse reports:** Few reports per project → weak training or aggregation. Mitigation: use AI to augment (summaries, suggestions); do not train on tiny tenant data alone; prefer rules and benchmarks.
- **Inconsistent stages/labels:** Stage and risk from vision are not yet standardized across tenants. Mitigation: fixed taxonomy (ALLOWED_STAGES); calibrate risk; optional tenant-specific labels only in display.
- **No ground truth for predictions:** We do not store “actual delay” or “actual overrun” in core. Mitigation: start with explainable rules and heuristics; add optional “outcome” fields later (e.g. task completed_at) for supervised learning.
- **PII and tenant boundaries:** Photos and reports may contain PII. Mitigation: policy engine and strict image host rules (see AI_PLATFORM.md); no cross-tenant learning; anonymization only in dedicated pipeline for industry benchmarks (see AI_DATA_FLYWHEEL).
- **Bias and fairness:** Small or skewed tenant data can bias recommendations. Mitigation: explainable logic; industry benchmarks as reference; avoid high-stakes automated decisions without human review.

---

## AI maturity roadmap

| Stage | Focus | Deliverables |
|-------|--------|---------------|
| **Current** | Vision per image; job pipeline; policy/router/usage | AnalysisResult per media; AIService; quotas and governance |
| **Phase 12a** | Copilot + auto-doc | Dashboard copilot (summaries, alerts, weekly plan); auto daily report / executive summary |
| **Phase 12b** | Predictive + visual extension | Delay/bottleneck signals; extended vision (progress, defects, before/after); explainable |
| **Phase 12c** | Digital twin + flywheel | Time-layered model; progress timelines; anonymization pipeline; optional benchmarking |
| **Ongoing** | Explainability, safety, scale | Every feature maps to business value; tenant-safe; privacy-safe learning only |

No core domain rewrites; AI augments workflows. Prefer explainable AI and human-in-the-loop for material decisions.
