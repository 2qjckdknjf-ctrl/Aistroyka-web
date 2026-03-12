# Digital Twin Readiness

**Phase 12 — AI Platformization**  
**Linking tasks, media, BIM, reports; time-layered model; visual progress timelines.**

---

## Linking tasks, media, BIM, reports

- **Concept:** A “digital twin” in construction is a time-aware representation of the asset: what was planned, what was built, what was observed (photos, reports), and optionally BIM elements. We do not build the full twin; we make our data **twin-ready**: linkable by space, time, and identity.
- **Today:** Tasks and reports have project_id; media link to report; AI analysis links to media. Optional task/report fields: location, bim_element_id (Phase 11). No BIM model in our DB; we store references and metadata.
- **Target:** (1) **Task ↔ report ↔ media:** Already linked. (2) **Task ↔ BIM:** Optional bim_element_id / bim_global_id on task and optionally on report or media (e.g. “photo of element E”). (3) **Time:** All entities have created_at / updated_at; report has date; optional “effective_date” for progress. (4) **Space:** Optional location or level on task; BIM element implies space when BIM is present. (5) **Identity:** Assignee, reporter, tenant. No new core entities; optional fields and indexes.
- **Value:** External twin or 4D/BIM tools can consume our API: “tasks and reports for element E,” “media for project P in week W,” “progress by level over time.”

---

## Time-layered project model

- **Concept:** View project state “as of” a date: which tasks were open/closed, which reports existed, what AI said about progress. Enables “as-built” story and replay.
- **Implementation:** (1) **Query layer:** API or view: “projects/tasks/reports as of date D” using created_at/updated_at and report date. (2) **Snapshots (optional):** Periodic materialized snapshot (e.g. nightly) of project state for fast “as of” queries; else compute from events. (3) **No change to core writes:** We do not rewrite history; we only query past state.
- **Output:** Time-layered API: e.g. GET /api/v1/projects/:id/state?as_of=2026-03-01 returns tasks, report count, last analysis summary as of that date. Optional: export for external twin.
- **Value:** Progress over time; dispute resolution; handover “as-built” evidence; partner integrations.

---

## Visual progress timelines

- **Concept:** Visualize progress along time: by day or week, show “report count,” “completion %,” “tasks closed,” “high-risk findings.” Can be chart (e.g. completion over time) or timeline (events on a line). Data from existing entities + optional cached aggregates.
- **Data:** (1) Per day/week: report count, sum of completion_percent (or avg) from analysis, task completed count, overdue count, risk count. (2) Optional: before/after pairs (Visual AI) on timeline. (3) Source: query or precomputed table (e.g. project_daily_stats).
- **UI:** Dashboard or project view: timeline or chart; filter by project, date range. Link to underlying reports and media.
- **Value:** At-a-glance progress; trend “stalled” or “accelerating”; supports meetings and client updates.
- **Explainability:** Each point is “from N reports and M photos”; drill-down to list.

---

## Implementation principles

- **No core domain rewrite:** Add optional fields (bim_element_id, effective_date) and query/views; do not change task/report/media creation flow. Twin readiness is additive.
- **Tenant-safe:** All data and APIs scoped by tenant. External twin or partner consumes via public API with tenant key.
- **Standard and linkable:** Use stable IDs (task_id, report_id, media_id); optional BIM global IDs per Phase 11. Document schema for “twin feed” (tasks, reports, media, analysis by project and time).
- **Value first:** Ship “state as of date” and “progress timeline” from existing data; add BIM linkage when BIM integration exists; then promote “twin-ready” API for partners.
