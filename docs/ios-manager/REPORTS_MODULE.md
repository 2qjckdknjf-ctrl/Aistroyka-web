# Reports Module (Phase 2)

**Date:** 2026-03-07  
**Scope:** Real reports inbox and report detail review.

## Summary

- **Endpoints wired:** GET /api/v1/reports (existing), GET /api/v1/reports/:id (ManagerAPI.reportDetail(id:)).
- **Backend:** reports route and reports/[id] route use createClientFromRequest(request) for Bearer auth.
- **DTOs:** ReportDetailDTO (id, tenantId, userId, taskId, status, createdAt, submittedAt, media), ReportMediaItem (mediaId, uploadSessionId), ReportDetailResponse.
- **Views:** ReportsInboxView (list, project filter chips, pull-to-refresh, loading/empty/error), ReportRowView (id, status, media count, analysis status), ReportDetailReviewView (sections: Report, Media), FilterChip (reusable).
- **Tab:** ManagerTabShell uses ReportsInboxView (replaces ReportsInboxPlaceholderView). Approval/review write endpoints not yet implemented; UI is read-only review.
