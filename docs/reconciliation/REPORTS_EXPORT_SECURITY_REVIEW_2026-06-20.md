# Reports Export Security Review — 2026-06-20

## Checks

| Question | Answer | Evidence |
|---|---|---|
| Anonymous blocked? | YES | `requireTenant` failure returns 401/403 before export service. |
| Worker blocked? | YES | `isLiteWorkerClient(ctx)` returns 403 before export service. |
| Owner/customer/stakeholder blocked? | YES for stakeholder/customer-style portal role | `ctx.role === "stakeholder"` returns 403. Tenant owner/admin remain allowed as manager/admin actors. |
| Manager/admin scoped? | YES | Requires tenant context and `canReviewReport(ctx)`. |
| Cross-tenant blocked? | YES by design | Service queries `worker_reports.eq("tenant_id", tenantId)` using tenant ID from server context. |
| Project scope checked? | YES | If `project_id` is supplied, route calls `getProject` before export. |
| Forbidden fields absent? | YES | Fixed `REPORT_EXPORT_COLUMNS` excludes finance, notes, media URLs, names/emails/phones. |
| Service-role leakage avoided? | YES | Route uses `createClientFromRequest`, not service-role admin client. |
| CSV injection handled? | YES | String values starting `=`, `+`, `-`, or `@` are prefixed with apostrophe. |
| Finance fields absent? | YES | No cost/budget/margin/profit fields selected or emitted. |
| Media URLs absent? | YES | Only `media_count` is emitted. |
| Notes absent? | YES | `manager_note`, `worker_note`, comments/free text are not selected or emitted. |

## Remaining Caveat
- Tenant owner/admin are allowed as internal manager/admin actors. Customer/property-owner portal actors remain blocked because this route does not serve stakeholder/customer export.

## Security Verdict
- Implementation closed from a security scope perspective: YES, pending full validation pass.
