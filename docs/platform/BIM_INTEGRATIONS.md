# BIM & Design Integrations

**Phase 11 — Ecosystem Integrations & Platformization**  
**Model linkage, IFC, versions, and viewer pathway; no core domain rewrite.**

---

## Model linkage to tasks

- **Concept:** Tasks or reports can reference a “location” or “element” in a BIM model (e.g. by global_id, classification, or room/level). Enables “task at element” and “report at element” for coordination and handover.
- **Data:** Optional on task or report: `bim_element_id`, `bim_global_id`, `bim_level`, `bim_room` (or JSON `bim_context`). Stored as reference; no geometry in our DB.
- **UI:** When creating/editing task or when submitting report, user can pick from linked model (level, room, or element list). List comes from integration (BIM API or IFC parse).
- **Value:** Traceability from field task/report to design element; clash and RFI context; digital twin readiness.

---

## IFC ingestion

- **IFC:** Industry Foundation Classes (ISO 16739); exchange format for BIM. We do not store full IFC; we ingest for structure (levels, spaces, elements) and optionally cache minimal metadata.
- **Flow:** (1) Customer uploads IFC (or we pull from integration). (2) Server-side parse (e.g. ifcjs or lightweight parser) to extract levels, spaces, and element global_ids. (3) Store in integration table: project_id, version_id, level/space/element list. (4) Expose to task/report linkage and to viewer.
- **Scope:** Read-only ingestion; no authoring. Large IFCs: background job; limit size or LOD for performance. No IFC in core domain; integration module only.

---

## Version management

- **Concept:** One project can have multiple “model versions” (e.g. design rev 1, 2, as-built). Each version has version_id, label, created_at, and optional link to file or external system.
- **Storage:** Table or integration store: project_id, version_id, label, file_path or external_url, created_at. Tasks/reports can reference version_id + element so we know which version they refer to.
- **Sync:** If BIM tool exposes versions via API, we sync version list; else manual upload per version. No automatic diff between versions in core; optional “compare” in viewer or reporting later.

---

## Drawing sync

- **Drawings:** 2D PDF or DWG often accompany model. Link drawing to project and optionally to level/sheet. Store reference (file or URL); no CAD in core.
- **Sync:** From CDE (Common Data Environment) or file share: list of drawings; metadata (sheet, discipline, revision). We store list and link to project/level; open in viewer or external app.
- **Format:** List via API or CSV; file URL or upload to our storage. Standard naming (e.g. sheet number) for matching.

---

## 3D viewer pathway

- **In-app viewer:** Embed or link to a 3D viewer (e.g. IFC.js, Forge, or partner) that loads model (by URL or our signed URL). Viewer shows model and can highlight element by global_id (from task/report linkage).
- **Pathway:** (1) We store model URL or serve from our storage. (2) Frontend opens viewer with model URL + optional element_id. (3) Viewer highlights element; user can create task or report “at” that element. No geometry stored in our DB; viewer is client or iframe.
- **Performance:** Large models: stream or LOD; consider CDN and viewer tuning. Out of core domain; integration and frontend only.

---

## Digital twin readiness

- **Definition:** “Digital twin” = digital representation updated with real-world data. Our contribution: tasks and reports (status, photos, dates) as “real-world” events that can be associated with model elements.
- **Readiness:** (1) Element linkage (task/report ↔ element). (2) Optional export: events by element and time (e.g. for external digital twin or analytics). (3) No real-time sensor or IoT in scope; manual report and task data only.
- **Format:** Export or API: project_id, version_id, element_id, events (task_created, report_submitted, etc.) with timestamp. Consumer (twin platform) can overlay on model. Standard: consider OGC or industry schema when adopted; for now proprietary JSON or CSV.

---

## Implementation principles

- **Modular:** BIM ingestion and viewer are integration/feature layer; no change to project/task/report domain entities except optional foreign keys or JSON for bim_context.
- **Tenant-safe:** Models and versions are project-scoped; RLS and tenant_id on any new table. No cross-tenant model access.
- **Standard protocols:** IFC for ingestion; REST for version and element list. Viewer uses standard WebGL/Three.js or partner SDK.
- **Value first:** Start with “link task to level/room” and one viewer path; add IFC parse and full element list when needed.
