# Step 10 — Action Layer Integration

## Unified model (manager mental model)

| Surface | Label | Meaning | Primary CTA pattern |
|---------|-------|---------|---------------------|
| Dashboard card | **Operations queue** | Real workflow objects (tasks, reports, jobs, uploads) | **Act →** |
| AlertFeed | **Tenant alerts** | Platform/tenant signals (SLO, AI budget, spikes) | Contextual area + **Locate on alerts page** |
| Project detail | **Next actions (from AI analyses)** | Deterministic rules on analysis history | Tab-specific **Open … →** |
| Intelligence tab | **Intelligence actions** | API-derived risks/evidence/recommendations | **Act →** when href exists |

## Alignment

- **Severity**: Red/amber/blue bands consistent (high/medium/low, P0/P1/P2).  
- **Wording**: No surface claims to be “the” single truth; each states its data source.  
- **Drill-down**: Every actionable row has a **named** destination (no vague “Open related” only).

## Drift to watch

- If new alert types are added, update `getAlertDestinations`.  
- If `computeActionItems` gains new titles, update `getNextActionHref`.
