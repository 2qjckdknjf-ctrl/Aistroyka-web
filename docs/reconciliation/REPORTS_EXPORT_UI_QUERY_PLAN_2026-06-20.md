# Reports Export UI Query Plan — 2026-06-20

## Route URL
- `/api/v1/reports/export`

## Selected Placement Params
- `project_id`: required for project Reports tab UI.

## Optional Params
- `status`: may be included only if the project reports UI exposes a status filter later.
- `from`: defer unless project reports UI has date filter.
- `to`: defer unless project reports UI has date filter.
- `range_days`: defer for first UI; avoid hidden date behavior.

## Current Filters
- Top-level Reports page has filters, but selected placement is project Reports tab.
- Project Reports tab currently has pagination only, no filters visible in the panel.

## Safe Default Behavior
- First UI should generate:
  - `/api/v1/reports/export?project_id=<projectId>`
- Use an anchor or button that opens/downloads the CSV.
- Do not call `/api/v1/projects/export`.
- Do not add finance/customer/stakeholder params.

## Forbidden Params
- any finance/cost/budget/margin param
- customer/stakeholder params
- media URL params
- notes/comment params
- AI output params
- unsupported backend params
