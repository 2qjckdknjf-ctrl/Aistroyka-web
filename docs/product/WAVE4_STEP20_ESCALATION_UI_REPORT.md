# Wave 4 Step 20 — Leadership UI report (Stage D)

## Surfaces

| Surface | Path / component | Behavior |
|---------|------------------|----------|
| List | `/dashboard/governance` — `GovernanceCasesClient.tsx` | Fetches `GET /api/v1/governance/cases`; filters by status / severity; empty state; create form (title, rationale, severity, decision required, multi-select projects, submit `POST`) |
| Detail | `/dashboard/governance/[id]` — `GovernanceCaseDetailClient.tsx` | Fetches case; shows linked projects with links to project dashboard; PATCH for status, outcome, fields |
| Navigation | `DashboardShell.tsx` | Nav item `governance` → `/dashboard/governance` |
| i18n | `messages/*.json` | `nav.governance` in `en`, `es`, `it`, `ru` |

## UX principles (Step 20)

- **Concise, decision-oriented** copy — not a ticket backlog aesthetic.
- **Project chips / links** — drill down to affected projects from detail view.
- **No shell redesign** — reuses existing dashboard layout and table primitives.
- **Shared UI fix** — `TableCell` supports `colSpan` / `rowSpan` for empty-state rows (`components/ui/Table.tsx`).

## Limitations

- No dedicated mobile layout beyond responsive dashboard.
- No inline audit timeline UI in Step 20 (events stored server-side; can be surfaced later).
