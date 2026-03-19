# Step 10 — AlertFeed Drill-Down

## Status after Step 10

**PARTIAL → strong PARTIAL**: No entity linkage (DB has no resource_id); **materially less dead-end** via dual navigation.

## Changes

1. **`getAlertDestinations(alertId, type)`** — `lib/dashboard/alert-destinations.ts`:
   - **Area link** + human label (e.g. “Review AI jobs & usage”, “Open dashboard overview”, “View all alerts”).
   - **List anchor**: `/dashboard/alerts#alert-{id}`.
2. **AlertFeed**: Each row `id="alert-{id}"`, `scroll-mt-4`; two links per row.
3. **Alerts page**: `AlertsScrollToHash` scrolls to hash on load.
4. Card title **Tenant alerts** (vs generic “Alerts”).

## Remaining gaps

- No per-alert deep link to a project until schema supports it.  
- Unknown types still land on alerts list (honest fallback).
