# PR 109 Authenticated Runtime Final Evidence — 2026-06-20

## Access Mode Used
- Local owner/admin browser session.
- Local URL: `http://localhost:3010`
- Credentials source: gitignored local env files; no secrets printed or recorded.

## Role / Session
- Session type: owner.
- Other role sessions: not available / not run.

## Project Checked
- Project ID discovered from authenticated `/api/v1/projects` response.
- Project ID value is not security-sensitive, but omitted from this doc to keep evidence concise.

## Project Subnav Result
- Dashboard loaded: PASS.
- Project detail loaded: PASS.
- Project subnav visible: PASS.
- Overview visible and active by default: PASS.
- Reports visible and active on `?tab=reports`: PASS.
- Documents visible: PASS.
- Timeline visible: PASS.
- Approvals visible: PASS.
- Overview not active on hidden/internal `?tab=costs`: PASS.

## Reports Export UI Result
- Export CSV visible for owner session: PASS.
- Export URL path: `/api/v1/reports/export`: PASS.
- Export URL params: `project_id` only: PASS.

## CSV Result
- Export API response: 200.
- Content-Type: `text/csv; charset=utf-8`.
- Content-Disposition: `attachment; filename="reports-export.csv"`.
- CSV header:
  - `report_id,project_id,worker_user_id,status,created_at,submitted_at,reviewed_at,media_count,analysis_status`
- Forbidden field sample check: PASS, no cost/budget/margin/profit/finance/note/media URL/email/phone/customer/stakeholder fields found in sampled CSV.

## Runtime Fix Applied
- Initial runtime attempt showed `?tab=reports` did not activate the Reports tab.
- Fixed by centralizing project detail tab parsing in `project-detail-tabs.ts`.
- Initial runtime attempt also showed export UI hidden on an empty Reports tab.
- Fixed by rendering the owner/admin export action before the empty state.
- Runtime then showed missing `dashboardDetail.openReports`; added localized key in en/ru/es/it.

## Screenshots
- None created.

## Limitations
- Non-owner role visibility was not runtime-verified because separate sessions were not available.
- Hosted Vercel and Cloudflare previews remain platform-auth protected.
