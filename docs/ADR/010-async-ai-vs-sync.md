# ADR-010: Async AI vs sync

**Status:** Accepted  
**Decision:** Report submit does not call AI synchronously. It enqueues ai_analyze_report and ai_analyze_media jobs. Client polls GET /api/v1/reports/:id/analysis-status. Sync analyze-image route remains for legacy and direct calls.

**Consequences:** Submit is fast; AI runs in background; mobile can poll or use sync endpoint.
