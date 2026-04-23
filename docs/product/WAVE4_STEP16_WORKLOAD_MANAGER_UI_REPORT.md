# Wave 4 Step 16 — Manager / leadership UI

## D1 — Surfaces

- **Route**: `GET /[locale]/dashboard/workload` — `page.tsx` + `WorkloadInboxClient.tsx`
- **Nav**: `DashboardShell` sidebar link `href: /dashboard/workload`, i18n key `nav.workload`

## Behavior

- Client fetches `/api/v1/workload?audience=manager` and `audience=leadership` in parallel (React Query).
- **Filter**: all | urgent | high | normal (client-side on returned items).
- **Layout**: two sections — **Execution** (manager items) and **Portfolio / leadership** (critical portfolio rows) — leadership items are not mixed into manager semantics.

## Drilldowns

Each row links via `action_url` to approvals, project tabs (`?tab=schedule|documents|defects|aftercare`), client discussion path for manager-response discussions, or portfolio project href.

## D3 — Dashboard scope

No redesign of dashboard home; single new page + nav entry.

## Limitations

- No server-side “kind” filter (priority only).
- English labels in badges (“Urgent”, “High”) in client — not fully i18n in component.
