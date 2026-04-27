# Wave 4 Step 1 — Schedule layer inventory (Stage A)

**Date:** 2026-03-28  
**Scope:** Milestones, task linkage, schedule signals, manager surfaces only.

## A1. Existing model (before / as extended)

### Projects

- Core `projects` row; tenant-scoped via RLS and app guards.

### Tasks (`worker_tasks`)

- **Due dates:** `due_date` (optional) — used elsewhere for overdue-task style signals, independent of milestones.
- **Statuses:** includes `done`, `in_progress`, etc. Milestone progress counts **done** vs total linked tasks.
- **Milestone link:** `milestone_id` nullable FK → `project_milestones(id)` (from `20260307200000_project_milestones.sql`).

### Milestones (`project_milestones`)

- **Fields:** `id`, `tenant_id`, `project_id`, `title`, `description`, `target_date`, `status`, `sort_order`, timestamps.
- **Original statuses:** `pending`, `in_progress`, `done`, `cancelled` (superseded by Wave 4 enum; see backend report).

### Ordering

- Milestones list sorted by `target_date` / `sort_order` in repository; UI sorts by `target_date` for readability.

### Report / date signals

- Reports and media timelines are **out of scope** for this step; schedule pressure for milestones uses **milestone `target_date` + linked task completion** only.

## A2. Gap analysis

| Capability | Already present | Added in Step 1 |
|------------|-----------------|-----------------|
| Milestone entity | Yes (`project_milestones`) | Status vocabulary aligned to product language |
| Task → milestone | Yes (`worker_tasks.milestone_id`) | Unchanged; manager links via tasks UI / API |
| Progress vs plan | Partial (counts possible) | Explicit **linked task counts**, **%**, **schedule_signals** on list API |
| Manager schedule UI | Basic list + create | Enriched cards, signals, status PATCH, deep links to tasks |
| Project-level overdue | Not present | **`overdueMilestonesCount`** in project summary + derived **attentionItems** |

## A3. Minimal milestone model (authoritative)

Aligned with DB after migration `20260328120000_wave4_milestone_status.sql`:

| Field | Notes |
|-------|--------|
| `id` | UUID |
| `tenant_id` | Tenant isolation |
| `project_id` | FK project |
| `title` | Required |
| `description` | Optional |
| `target_date` | Date — plan anchor |
| `status` | `planned` \| `in_progress` \| `completed` \| `delayed` \| `archived` |
| `sort_order` | Integer |
| `created_at` / `updated_at` | Standard |

**Rationale:** Explicit lifecycle without CPM; `delayed` and `archived` are human-set or operational states, not inferred critical path.

## A4. Task ↔ milestone linkage (minimal blast radius)

- **Single FK:** `worker_tasks.milestone_id`.
- **Unlink:** set `milestone_id` to null via task update (existing task routes).
- **No new junction table** — one milestone per task, sufficient for construction checkpoint tracking at this depth.

## Conclusion

The strongest safe schedule layer is: **existing tables + enriched read model (counts, signals) + summary overdue aggregate + manager Schedule tab.** No Gantt, no dependency graph.
