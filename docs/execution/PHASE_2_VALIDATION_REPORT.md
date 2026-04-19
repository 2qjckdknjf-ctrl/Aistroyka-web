# Phase 2 — Validation Report

**Date:** 2026-04-18  
**Scope in this step:** Stage C runtime closure after staging hotfix deploy.

## Evidence checks executed

- Reviewed document type/status model:
  - `apps/web/lib/domain/documents/document.types.ts`
- Reviewed project documents API surfaces:
  - `apps/web/app/api/v1/projects/[id]/documents/route.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/decision/route.ts`
- Reviewed manager documents UI:
  - `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- Reviewed approvals queue document handoff:
  - `apps/web/app/[locale]/(dashboard)/dashboard/approvals/DashboardApprovalsClient.tsx`
- Reviewed document upload route:
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.ts`
- Added and executed upload path unit tests:
  - `apps/web/lib/domain/documents/document-upload-path.test.ts`
- Ran live runtime matrix rerun on staging:
  - see `PHASE_2_RUNTIME_MATRIX.md`

## Commands executed

1. `bun run --cwd apps/web test lib/domain/documents/document-upload-path.test.ts` -> PASS
2. Supabase MCP `execute_sql` (inspect `storage.objects` policies) -> identified tenant-members-only policy constraint
3. Supabase MCP `apply_migration` (`media_storage_owner_access`) -> PASS
4. Supabase MCP `apply_migration` (`media_storage_project_prefix_access`) -> PASS
5. Triggered staging deployment for hotfix branch and verified build/deploy job success:
   - `Deploy Cloudflare (Staging)` run `24602840424` (deploy success; smoke workflow failed independently on tenant-auth token expectations).
6. Live staging upload recheck (`POST .../documents/{id}/upload`) -> PASS (`200`)
7. Live staging runtime flow `create -> upload -> under_review -> request_changes -> under_review -> approved` -> PASS
8. Live staging runtime flow `create -> upload -> under_review -> reject` -> PASS
9. Live staging probe for owner decision route (`POST .../decision`) with admin actor -> `403` (expected owner-only access control)

## Validation verdict for this step

- `PASS` for Phase 2 manager closure criteria: document upload semantics, review transitions, resubmission loop, reject loop, and approval-history evidence are runtime-proven on staging.
