# Export / Report Outside-Main Inventory — 2026-06-20

No outside-main code was ported. All items below are references for later implementation planning only.

| Source branch | Route/file | What it adds | Conflict with main | Tenant/auth assumptions | Finance exposure risk | Safe idea/reference only | Later action |
|---|---|---|---|---|---|---|---|
| `release/mobile-pilot-rc` | `apps/web/app/api/v1/projects/export/route.ts` | New `GET /api/v1/projects/export` immediate CSV response for tenant projects | Additive route absent from main | `getTenantContextFromRequest`, `requireTenant`, request-bound Supabase | Medium/high: project export can expose tenant-wide project metadata and possible finance fields depending service | YES | Reimplement/test later; do not blindly port |
| `release/mobile-pilot-rc` | `apps/web/app/api/v1/reports/export/route.ts` | New `GET /api/v1/reports/export` immediate CSV response with `project_id` and `range_days` query | Additive route absent from main | `getTenantContextFromRequest`, `requireTenant`, request-bound Supabase | Medium: report CSV can expose worker notes, media metadata, project scope | YES | Reimplement/test later with safe columns |
| `release/mobile-pilot-rc` | `apps/web/app/api/v1/reports/[id]/route.ts` | Adds approval event insert, sync change emission, and user notification after report review | Behavior-changing patch to existing route | Existing manager review context | Low finance risk, but side effects can leak notification/sync state if tenant scoped incorrectly | YES | Manual review with side-effect tests |
| `release/mobile-pilot-rc` | `apps/web/lib/domain/notifications/manager-notifications.repository.ts` | Adds `notifyUser` helper | Additive helper | Caller passes tenant/user IDs | Low/medium: notification target must be tenant-bound | YES | Use only with tenant ownership tests |
| `release/mobile-pilot-rc` | `apps/web/lib/platform/jobs/job.handlers/export.ts` | Replaces export placeholder with `runExportJob` | Behavior-changing job handler | Internal job context assumed | Medium: storage/export path can leak tenant data | YES | Defer until job storage/export model reviewed |
| `feature/unified-product-design-certification` | same export/report route set | Bundles mobile export/report changes with AI/design/mobile scope | Too broad | Mixed | High due broad bundle | YES | Do not use as primary source |
| `design/liquid-glass-public-shell-lg2a` | AI expert review/export-dry-run only | AI Flywheel export-dry-run docs/service, not product report export | Not relevant to report export | AI/internal | High/unknown | NO for this phase | Ignore for export/report implementation |
| AI branches | AI feedback, training consent, expert review queue, export-dry-run | AI dataset/export dry-run dependencies | Blocked by AI migrations | Tenant/admin AI assumptions | High | Dependency only | Keep blocked |

## Outside-Main Verdict
- Useful candidate ideas:
  - project/report CSV export routes
  - report review approval-event/sync/notification side effects
- Unsafe candidates:
  - broad certification/design branches as sources
  - AI export/dataset code
  - job storage/export behavior before storage and tenant path review
- Later implementation should reimplement the smallest safe subset, using outside-main branches as reference only.
