# Visual Hierarchy & Scannability (Phase 5)

**Date:** 2026-03-07  
**Scope:** Manager screens refinement guidance.

---

## Principles applied

- **Section grouping:** List sections used consistently (Task, Assign, Report, Review actions). No change to domain; grouping clarifies blocks.
- **Status visibility:** Report and task status shown as capitalized label (e.g. "Approved", "Changes requested"); report detail shows reviewed_at and manager_note when set.
- **Action placement:** Primary actions (Assign to worker, Approve / Mark reviewed / Request changes) in their own section below metadata; consistent across task and report detail.
- **Metadata rows:** LabeledContent for ID, status, dates; compact and scannable.

## Recommendations (optional future)

- **Status badges:** Extract status string into a small pill/capsule (e.g. .background + .clipShape(Capsule())) for submitted / approved / overdue.
- **Alert banners:** For stuck uploads or failed jobs, a thin banner above dashboard content when queues are non-empty.
- **Section dividers:** System list already provides; optional custom header with divider for "Needs attention."
- **Compact info grids:** Dashboard KPIs already in LazyVGrid(columns: 2); project summary could use a similar grid for counts.
- **Spacing:** Standard list and padding; no change to avoid layout churn. Enterprise tone preserved.
