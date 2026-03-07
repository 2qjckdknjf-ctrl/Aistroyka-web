# Home Dashboard — Real Data (Phase 2)

**Date:** 2026-03-07  
**Scope:** HomeDashboardView upgraded from skeleton to real manager dashboard.

## Summary

- **Endpoint wired:** GET /api/v1/ops/overview (ManagerAPI.opsOverview).
- **DTOs:** OpsOverviewDTO, OpsOverviewKpis, OpsOverviewQueues, QueueItem, TaskQueueItem (snake_case CodingKeys).
- **Backend change:** ops/overview route uses createClientFromRequest(request) for Bearer auth (iOS Manager).
- **UI:** KPI grid (active projects, workers today, reports today, overdue tasks, open today, stuck uploads); "Needs attention" (overdue task titles, reports pending count); loading, error with retry, pull-to-refresh, onAppear load.
- **Design:** Uses LoadingStateView, ErrorStateView, KPICard.

## Components used

- LoadingStateView, ErrorStateView, KPICard (Manager Design).
- .refreshable { await loadAsync() }, onAppear { load() }.
