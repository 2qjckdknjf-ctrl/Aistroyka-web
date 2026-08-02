# QA Coverage Report

Generated: 2026-07-03T07:01:28.790Z

## Summary

| Surface | Total | Referenced in tests | Coverage |
|---------|-------|---------------------|----------|
| Pages | 104 | 72 | 69% |
| APIs | 287 | 127 | 44% |
| Vitest files | 301 | — | unit layer |

## Untested pages (32)

- `/[locale]`
- `/admin/billing-pilot`
- `/admin/governance`
- `/admin/leads`
- `/admin/leads/[id]`
- `/admin/operator`
- `/admin/system`
- `/admin/trust`
- `/billing/cancel`
- `/dashboard/governance`
- `/dashboard/governance/[id]`
- `/dashboard/projects/[id]/change-orders/[changeOrderId]`
- `/dashboard/projects/[id]/client/change-orders`
- `/dashboard/projects/[id]/client/change-orders/[changeOrderId]`
- `/dashboard/projects/[id]/client/defects`
- `/dashboard/projects/[id]/client/defects/[defectId]`
- `/dashboard/projects/[id]/client/discussions`
- `/dashboard/projects/[id]/client/discussions/[discussionId]`
- `/dashboard/projects/[id]/client/service-requests`
- `/dashboard/projects/[id]/client/service-requests/[requestId]`
- `/dashboard/projects/[id]/defects/[defectId]`
- `/dashboard/projects/[id]/discussions/[discussionId]`
- `/dashboard/projects/[id]/handover/pack`
- `/dashboard/projects/[id]/service-requests/[requestId]`
- `/dashboard/stakeholder-invite`
- `/dashboard/workers/[userId]/days`
- `/dashboard/workload`
- `/invite/accept`
- `/portfolio`
- `/share/proof/[token]`

… and 2 more

## Untested APIs (160)

- `/api/ai/analyze-video-daily`
- `/api/ai/transcribe`
- `/api/auth/callback`
- `/api/invite`
- `/api/projects/[id]/jobs/[jobId]/trigger`
- `/api/projects/[id]/media/[mediaId]/trigger`
- `/api/projects/[id]/poll-status`
- `/api/tenant/accept-invite`
- `/api/tenant/invitations`
- `/api/tenant/invite`
- `/api/tenant/members`
- `/api/tenant/profile`
- `/api/tenant/revoke`
- `/api/v1/admin/analytics/ai-guide`
- `/api/v1/admin/analytics/ai-risk`
- `/api/v1/admin/analytics/productivity`
- `/api/v1/admin/anomalies`
- `/api/v1/admin/audit-logs`
- `/api/v1/admin/billing/pilot-status`
- `/api/v1/admin/billing/pilot-workspaces`

… and 140 more

## Permission test gaps

- member
- viewer

## AI flow gaps

- transcribe
