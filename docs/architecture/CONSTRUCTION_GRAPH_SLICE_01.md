# Construction Graph slice 01 — 2026-10-03

**Status:** FIRST PRODUCT QUERY — not PROVEN on live project data.

Query `GET /api/v1/projects/:id/graph` rebuilds a tenant/project-scoped overlay from existing SOT tables (`projects`, `worker_tasks`, `worker_reports`, `media`, `project_defects`, `project_documents`). Nodes store source table + id only. Missing task FKs do not invent task nodes.

Overlay tables `construction_graph_nodes` / `construction_graph_edges` are in `20261003120000_construction_graph_overlay.sql` (RLS select via `can_read_project_membership`). Remote apply is a follow-up after merge; the HTTP query does not require those tables.
