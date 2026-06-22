# Reports Export Contract Decision — 2026-06-20

## Decision
- Contracts updated: NO.

## Reason
- The implemented success response is `text/csv; charset=utf-8`, not JSON.
- Existing `packages/contracts` patterns are primarily Zod schemas for JSON request/response bodies.
- The slice has no frontend/mobile UI consumer and no generated OpenAPI update requirement.
- Route and service tests define and lock the CSV contract:
  - query params
  - access behavior
  - headers
  - safe columns
  - forbidden field absence

## Future Contract Work
If this route becomes a public SDK/OpenAPI contract later, add:
- query schema for `project_id`, `status`, `from`, `to`, `range_days`
- documented CSV response headers
- error envelope schema for JSON error responses

## Current Validation
- `bun run build:contracts` remains required after implementation to ensure no contract package regressions.
