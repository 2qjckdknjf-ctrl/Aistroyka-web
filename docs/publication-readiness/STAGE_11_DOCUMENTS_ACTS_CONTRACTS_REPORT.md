# STAGE 11 — Documents / Acts / Contracts Manager Workflow Report

## 1. Goal

Verify manager-usable document workflow (create -> upload -> review -> decision/archive) and harden route-level coverage for authorization and linkage safety.

## 2. Files inspected

- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- `apps/web/app/api/v1/projects/[id]/documents/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/[documentId]/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.ts`
- `apps/web/lib/domain/documents/document.service.ts`
- `apps/web/lib/domain/documents/document.repository.ts`
- `apps/web/app/api/v1/projects/[id]/documents/decisions/route.test.ts`
- `apps/web/lib/domain/documents/document.service.test.ts`

## 3. Findings

1. UI manager flow is present and production-real:
   - create document metadata (type/title/description + optional links)
   - upload file for draft docs
   - submit for review
   - approve/reject with comment
   - archive
   - approval history modal
2. Backend enforces transition guards and linkage validation:
   - prevents invalid status transition/object path update
   - prevents cross-project report/task/milestone linkage
   - records governance events and audit emissions on transitions
3. Gaps were mainly in direct route-level tests for create/list and upload paths.

## 4. Changes made

1. Added route coverage for project documents collection:
   - `apps/web/app/api/v1/projects/[id]/documents/route.test.ts`
   - covers list success, create validation failures, forbidden create, and successful create.
2. Added route coverage for document upload:
   - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.test.ts`
   - covers insufficient rights, wrong project linkage, invalid draft-state upload, and successful upload-to-uploaded transition.

## 5. Validation commands

```bash
bun run --cwd apps/web test "app/api/v1/projects/[id]/documents/route.test.ts" "app/api/v1/projects/[id]/documents/[documentId]/upload/route.test.ts" "app/api/v1/projects/[id]/documents/decisions/route.test.ts" lib/domain/documents/document.service.test.ts
```

## 6. Validation result

- Passed (`21/21` tests).
- Manager document workflow coverage now includes create, upload/register metadata, decision paths, and unauthorized/wrong-linkage protections.

## 7. Remaining gaps

1. Full browser/runtime walkthrough of the documents tab on live data remains pending.
2. Storage permission parity on production Supabase bucket policies still requires live environment proof.

## 8. Blockers

- None for repository-side manager document workflow hardening.

## 9. Commit hash

Pending (generated after commit).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

CLOSED

