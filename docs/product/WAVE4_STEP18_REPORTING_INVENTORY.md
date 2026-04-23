# Wave 4 Step 18 — Executive reporting scope inventory

## A1 — Truth sources

| Source | Used in review packs |
|--------|----------------------|
| Project summary (`getProjectSummary`) | Budget snapshot, counts |
| Portfolio control (`buildPortfolioControl` / `buildPortfolioProjectControlRow`) | Executive signal, primary reason, per-project rows |
| Handover readiness (`computeHandoverReadinessFromSummary`) | Blocker lines, handover snapshot |
| Project attention (`getProjectAttentionSummary`) | Decisions / issues sections |
| Stakeholder activity timeline (`getStakeholderActivityTimeline`) | Recent important client/stakeholder events |
| Aftercare | Via control signals + narrative |

Not duplicated as raw dumps: workload inbox, recurring ops (referenced only indirectly through overlapping signals).

## A2 — Pack types

1. **Project review pack** — one project, internal workspace only (`getProjectForInternalWorkspace`).
2. **Portfolio review pack** — tenant portfolio sample (same cap as portfolio control: 20 projects).

**Optional deferred:** standalone “handover-only” pack — handover is a **section** inside the project pack instead.

## A3 — Minimum sections

- Header: executive signal (healthy / attention / critical), one-line executive summary, status/health labels, section meta (why / summarizes / expected action).
- Control row: full `PortfolioProjectControlRow` for drilldown consistency.
- Budget snapshot: planned/actual/variance narrative.
- Handover: ready flag, blocker count, top blockers with hrefs.
- Aftercare: open count + link.
- Attention: document/issue queues (aggregated section counts).
- Recent changes: up to 5 stakeholder timeline items.
- Action focus: curated bullet list for leadership.

## A4 — Deferred

- Generic report builder, slide/PDF automation, analytics warehouse  
- AI-generated narrative as the primary mechanism  
- Deep historical trends and multi-year analytics  
