# Visual AI

**Phase 12 — AI Platformization**  
**Photo progress, quality, defects, before/after, site state; extend current vision.**

---

## Photo progress detection

- **Current:** Vision returns stage, completion_percent, risk_level, detected_issues, recommendations per image (AnalysisResult). Used for single-image insight.
- **Extension:** (1) **Temporal progress:** For a given location or task, aggregate completion_percent over time (by report date); trend “progress over time” and “stalled” (no increase in N days). (2) **Consistency:** Same stage taxonomy (ALLOWED_STAGES) across tenants; optional calibration per project type. (3) **Storage:** Keep per-media analysis; add optional project/task-level view that aggregates by time window.
- **Value:** Progress at a glance; early “no progress” alert; no new ingestion—reuse existing pipeline.
- **Explainability:** “Progress 40% → 65% in 7 days” or “No change in 10 days”; source = list of report dates and completion_percent.

---

## Quality issue detection

- **Concept:** From current detected_issues and risk_level, derive structured “quality” tags: e.g. safety concern, defect, cleanliness, weather/visibility. Map free-text issues to fixed taxonomy (optional tag set) so we can filter and report.
- **Extension:** (1) Optional structured output from vision: e.g. quality_issues: [{ type: "safety", description: "..." }]. (2) Or post-process: LLM or rules map detected_issues[] to taxonomy. (3) Store as tags on ai_analysis or media; use in filters and copilot alerts.
- **Value:** Consistent quality reporting; trend “quality issues by project” or “by contractor”; support for compliance.
- **Explainability:** Each tag linked to original issue text and image.

---

## Defect recognition

- **Concept:** Detect and tag defects in photos: cracks, damage, misalignment, missing elements, etc. Subset of quality issues with defect-specific taxonomy.
- **Extension:** (1) Vision prompt or dedicated model: output defect list with type and optional location (e.g. “crack, left side”). (2) Store defects in analysis result (e.g. defects: [{ type, description, area? }]). (3) Link to task or BIM element when available (Phase 11). (4) Optional severity; explainable from image and prompt.
- **Value:** Faster defect logging; linkage to tasks for remediation; evidence for handover.
- **Privacy:** Policy engine applies; no PII in prompts; image from allowed host only.

---

## Before/after comparison

- **Concept:** For a given task or location, pair “before” and “after” photos; generate short comparison narrative or delta (what changed, progress, remaining work).
- **Extension:** (1) **Pairing:** Same task_id or same location tag; order by date. (2) **Input to vision/LLM:** Two image URLs + optional task title; output: comparison text and optional completion_delta. (3) **Storage:** Optional before_after_analysis linked to task or to two media IDs. (4) **UI:** Side-by-side view with narrative.
- **Value:** Clear evidence of work done; handover and billing support; reduces manual write-up.
- **Explainability:** “Before: stage X, 20%; after: stage Y, 80%; narrative: …”

---

## Site state classification

- **Concept:** Classify site state per photo or per day: e.g. active work, idle, weather blocked, safety incident, handover. Complements stage and completion; used for dashboards and reporting.
- **Extension:** (1) Add to vision output: site_state or activity_class. (2) Or derive from existing stage + risk + issues (e.g. high risk + “safety” issue → “safety incident”). (3) Fixed enum; document in schema. (4) Aggregate by day/project: “3 days active, 1 idle” for reporting.
- **Value:** Executive view of site activity; idle-day detection; compliance and timesheet support.
- **Explainability:** State from rule or from model with short reason.

---

## Implementation principles

- **Extend, don’t replace:** Build on existing AIService and construction-brain; add optional fields to AnalysisResult or new analysis types. Same policy, router, usage, and job pipeline.
- **Tenant-safe:** All images and results scoped by tenant and project. No cross-tenant training on raw images in product.
- **Taxonomy:** Use fixed enums for stage, risk, quality type, defect type, site state; document in API and docs. Enables filtering and benchmarking.
- **Privacy-safe:** Policy engine and image-host rules apply; no PII in prompts; anonymization for any cross-tenant or benchmark use (see AI_DATA_FLYWHEEL).
- **Value first:** Ship progress and quality extensions first; then before/after and defect taxonomy; then site state when needed.
