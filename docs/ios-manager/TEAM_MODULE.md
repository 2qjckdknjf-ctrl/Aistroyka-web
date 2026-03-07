# Team / Workers Module (Phase 2)

**Date:** 2026-03-07  
**Scope:** Real team list and worker detail from GET /api/v1/workers.

## Summary

- **Endpoint wired:** GET /api/v1/workers (ManagerAPI.workers(limit:)).
- **Backend:** workers route uses createClientFromRequest(request) for Bearer auth.
- **DTOs:** WorkerRowDTO (userId, lastDayDate, lastStartedAt, lastEndedAt, lastReportSubmittedAt, anomalies), WorkerAnomalies (openShift, overtime, noActivity), WorkersListResponse.
- **Views:** TeamOverviewView (list + pull-to-refresh, loading/empty/error), WorkerRowView (row with user id, last day, anomaly badges), WorkerDetailView (sections: Worker, Last activity, Flags).
- **Tab:** ManagerTabShell uses TeamOverviewView (replaces TeamOverviewPlaceholderView).
