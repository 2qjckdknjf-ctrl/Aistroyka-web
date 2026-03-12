# Auto Documentation Engine

**Phase 12 — AI Platformization**  
**Daily report generation, work completion acts, executive summaries, project briefings.**

---

## Daily report generation

- **Concept:** From existing report and media data for a project and day, generate a narrative “daily report” (paragraph or bullet list) that summarizes what was done, what was found (from AI analysis), and any issues. Replaces or augments manual daily write-up.
- **Inputs:** Reports created that day for the project; their media; stored AI analysis (stage, completion, risk, issues, recommendations). Optional: task completions, assignees.
- **Process:** (1) Aggregate: list of reports with titles/bodies and linked analysis. (2) Optional LLM call: “Given these reports and findings, write a 1-paragraph daily summary.” (3) Output: text blob; store as generated_daily_report (project_id, date, body, source_report_ids). (4) Optional: attach to project or expose in “Daily brief” view.
- **Value:** Less admin work for site managers; consistent format; one place for “what happened today.”
- **Tenant-safe:** Only that tenant’s project data in prompt; no PII in prompt (IDs and counts only, or sanitized text). Policy and quota apply.
- **Explainability:** “Generated from 3 reports and 5 photos”; link to source reports.

---

## Work completion acts

- **Concept:** Formal “act” or certificate of work completion (e.g. for handover or billing). Generate from: task(s) completed, reports and media, AI analysis (progress, defects). Output: structured document (sections: scope, date, evidence, findings, sign-off placeholders).
- **Inputs:** Task(s) or project phase; reports and media in range; analysis results. Optional: template per tenant or project type.
- **Process:** (1) Collect evidence list (report titles, dates, completion %, key findings). (2) LLM or template: fill sections. (3) Output: document (e.g. Markdown or PDF via existing doc path); store reference and link to tasks/reports. (4) E-sign and storage per Phase 11 document ecosystem when available.
- **Value:** Faster handover docs; consistent structure; audit trail.
- **Explainability:** “Act generated from tasks X, Y and reports R1, R2”; list sources.

---

## Executive summaries

- **Concept:** Short executive summary for a project or portfolio: status, key risks, progress, what to watch. Generated periodically (e.g. weekly) or on demand.
- **Inputs:** Project(s); tasks (open, overdue, completed); reports and AI analysis in period; copilot health and recommendations. No finance unless ERP integrated.
- **Process:** (1) Aggregate health, delay risk, quality issues, overdue count. (2) LLM: “Write 3–5 sentence executive summary.” (3) Output: text; store or display in dashboard. Optional: email or PDF.
- **Value:** Leadership view without drilling down; consistent messaging.
- **Tenant-safe and explainable:** Data from tenant only; summary cites high-level facts (e.g. “2 projects at risk; 5 overdue tasks”).

---

## Automated project briefings

- **Concept:** Briefing pack for a project: current status, progress trend, recent reports, key AI findings, recommended actions. Used for internal standups or client updates.
- **Inputs:** Same as executive summary plus report list and recent media thumbnails or links.
- **Process:** (1) Structured data: health, tasks, reports, analysis. (2) LLM or template: narrative + bullet list + “Actions.” (3) Output: document or in-app view; optional export.
- **Value:** Prep time reduced; consistent briefing format; always up to date.
- **Explainability:** Sections tied to data; “Sources: reports from 1–7 Mar; 12 photos analyzed.”

---

## Implementation principles

- **No core domain rewrite:** Reports, tasks, media, and analysis remain the source of truth. Auto-doc produces derived content (new table or blob store); optional “generated_at” and “source_ids” for audit.
- **Tenant-safe:** All inputs scoped by tenant; prompts contain no cross-tenant data; policy and quota apply to LLM calls.
- **Privacy-safe:** No PII in prompts; use IDs, dates, and sanitized text. Policy engine applies if user content included.
- **Optional and modular:** Each output type (daily report, act, executive summary, briefing) can be feature-flagged per tenant. Fallback: show raw data if generation is off or fails.
- **Value first:** Start with daily report and executive summary (highest leverage); add acts and briefings when templates and e-sign are ready (Phase 11).
