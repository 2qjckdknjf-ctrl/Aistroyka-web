# Reports Export UI Safety Review — 2026-06-20

| Check | Result |
|---|---|
| Visible only to tenant owner/admin | YES |
| Hidden from project manager/member | YES |
| Hidden from worker | YES |
| Hidden from customer | YES |
| Hidden from stakeholder | YES |
| Hidden from anonymous | YES |
| No finance labels | YES |
| No project export label | YES |
| No AI/admin labels | YES |
| URL only uses `project_id` | YES |
| Backend route unchanged | YES |

## Notes
- UI uses a server-derived `canExportReports` boolean.
- Helper `canShowProjectReportsExport` allows only `owner` and `admin`.
- Helper `buildProjectReportsExportHref` emits only `/api/v1/reports/export?project_id=<encoded>`.
- Backend remains the authority for access control.
