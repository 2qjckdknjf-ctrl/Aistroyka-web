# Step 15 — Project Cost & Market Intelligence: Input Scope Inventory

## 1. Current Repo Truth

### 1.1 Project documents layer

- **project_documents**: id, tenant_id, project_id, type (document|act|contract), title, description, status, object_path (storage path in media bucket), report_id, task_id, milestone_id, created_by, timestamps. RLS tenant-scoped.
- **Upload**: ProjectDocumentsPanel accepts .pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg. Files stored via object_path; no content_type or mime in project_documents table.
- **APIs**: GET/POST /api/v1/projects/:id/documents; GET/PATCH /api/v1/projects/:id/documents/:documentId; upload at .../documents/:documentId/upload.
- **Conclusion**: Documents are listable by project with metadata (title, type, status). No PDF/DOC/XLS text or table extraction exists in repo. Document content is not available for cost extraction in Step 15.

### 1.2 Uploaded files / media

- **Upload sessions**: tenant_id, user_id, purpose, status, object_path, mime_type, size_bytes. Used for temporary uploads; final assets may land in project_documents (object_path) or report media.
- **Report media**: Images linked to worker_reports; ai_analyze_media job resolves image URL from report_id/media_id/upload_session_id and runs vision analysis.
- **Conclusion**: Image URLs can be resolved for report-linked media. No generic "project image bucket" list; project-scoped images exist as document attachments (object_path) or report media.

### 1.3 Image analysis

- **Routes**: POST /api/ai/analyze-image, POST /api/v1/ai/analyze-image (same handler). Accepts image URL; returns AnalysisResult (stage, completion_percent, risk_level, detected_issues, recommendations).
- **Job**: ai_analyze_media — resolve image URL from payload, call analyzeImage (policy → vision router → usage). Vision uses CONSTRUCTION_VISION_* prompts (construction stage, progress, risk, issues). Result stored in analysis pipeline (jobs, engine); no cost-specific fields.
- **Conclusion**: Vision pipeline is construction-progress oriented. No cost/estimate extraction from images today. Cost-oriented image analysis would require a new prompt variant and a place to store cost-specific result (e.g. estimate result entity).

### 1.4 PDF / specs / CAD

- **PDF/DOC content**: No OCR or text extraction in repo. Documents have object_path only; no "extracted_text" or "pages" table.
- **CAD/DWG/DXF**: No parsers, no CAD-specific routes or jobs. Not supported.
- **Conclusion**: PDF/spec content extraction and CAD are deferred. Explicit reason: no pipeline or libraries in repo; would require new dependencies and security review.

### 1.5 Cost / budget data

- **project_cost_items**: planned_amount, actual_amount, category, status, etc. (Step 14). getBudgetSummary returns planned_total, actual_total, variance_amount, over_budget, item_count.
- **Conclusion**: Budget data is the only existing "cost truth" per project. It can serve as grounding context, comparison target, and as a "budget-derived" estimate view when no AI estimate exists.

### 1.6 Manager-facing upload/link surface

- **Project page**: Tabs for Intelligence, Schedule, Documents, Costs. Documents tab: list, add, upload file. Costs tab: cost items, summary, edit. No dedicated "estimate inputs" or "cost intelligence" tab yet.
- **Conclusion**: We can add an "Estimate" or "Cost intelligence" section/tab that consumes estimate results and lists sources (documents as references, images if we support image-derived estimate).

---

## 2. Chosen Input Scope for Step 15

**Smallest high-value foundation:**

1. **Budget/cost data (existing)**  
   - Use as comparison and as "budget-derived" context. When project has cost items, show planned/actual vs AI estimate (if any). When no AI estimate, show budget-only view with explicit "no estimate from documents/images yet."

2. **Images (existing vision pipeline)**  
   - Add a **cost-oriented vision path**: one new prompt that asks for cost-relevant signals (work scope hints, rough cost range, confidence, missing data). Single image → one estimate result per run. Reuse same vision provider and policy/usage; store result in a new estimate-result entity. Input: image URL (e.g. from project document or upload). No multi-image BOQ in Step 15.

3. **Project documents (metadata only)**  
   - List project documents as **source references** for the estimate view ("Documents that can be used for estimate" or "Uploaded documents"). Do not extract document content. Document-derived estimate = deferred (no text extraction).

4. **Project/task/report context**  
   - Use existing project name, milestones, cost items as context when building estimate summary. No new task/report-level cost attribution.

**Explicitly in scope:**

- Estimate result entity (project-scoped, source_type: budget_snapshot | image | assumption).
- Image-based cost extraction (one image → one result) with structured output: work_categories, rough_range_min/max, currency_hint, confidence, missing_data_reasons, assumption_notes.
- Budget summary as comparison and as "budget-derived" when no image estimate.
- Manager UI: estimate/cost intelligence view with sources, rough range, confidence, budget comparison, missing-data clarity.

---

## 3. Deferred Inputs and Why

| Input | Reason |
|-------|--------|
| PDF/DOC/XLS text extraction | No OCR/text pipeline in repo; would require new service and security review. |
| CAD/DWG/DXF | No parsers or support; out of scope for foundation. |
| Multi-image / BOQ takeoff | Foundation is single-artifact signals; parametric takeoff is later phase. |
| Live market pricing / scraping | Step 15 is foundation; market context = configurable assumption label only. |
| Document content as estimate source | Document content not available; list as reference only. |
