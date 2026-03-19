# Step 9 — Operator workflow hardening

## API (`GET /api/v1/admin/ops/ai-runtime`)

- **`drilldown.by_route`** — histogram of AI audit events per route string.
- **`drilldown.complete_count` / `error_count` / `error_rate_window`** — window-level health.
- **`operator_hints`** — short classification strings (401/403/503 intelligence/vision, correlate).

## UI (`AdminAiRuntimePanel` on `/admin/ai`)

- Window selector (24h / 72h / 7d).
- Release correlation card.
- KPI row: completes, errors, error rate, hints.
- Traffic-by-route list.
- Recent errors table with `RequestIdPill` for trace copy.

## Documentation

- Admin page subtitle points to route-level rollup.
