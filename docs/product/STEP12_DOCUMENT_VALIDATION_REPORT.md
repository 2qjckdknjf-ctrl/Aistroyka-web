# Step 12 — Document Validation Report

**Date:** 2026-03-18

## Commands run

1. Unit tests (doc governance semantics)

```bash
cd apps/web
bun test lib/domain/documents/document.policy.test.ts lib/domain/documents/document.repository.test.ts
```

Result: **PASS** (12 tests)

2. Typecheck

```bash
cd apps/web
npx tsc --noEmit
```

Result: **PASS**

3. Production build (web)

```bash
cd apps/web
npx next build
```

Result: **PASS** (exit code 0)

4. Full repo build (contracts + web)

```bash
cd repo-root
npm run build
```

Result: **PASS** (exit code 0)

## Focused workflow checks (evidence-based)

- Backend governance enforcement:
  - status transition rules are in `document.policy.ts`
  - applied in `document.service.ts` (invalid transitions return `400` via API)
- Auditable history:
  - history endpoint exists: `.../approval-history/route.ts`
  - UI fetches and renders events via `DocumentApprovalHistory` component
- Manager UX:
  - `ProjectDocumentsPanel` shows correct actions by current status:
    - uploaded → submit for review
    - under_review → approve/reject
  - “History” modal is wired for each document row
  - linked-to column renders milestone/report/task links when fields exist

## Unrelated blockers

- None observed for Step 12. (Vitest/esbuild issues existed earlier in Step 10, but Step 12 tests were run through Bun.)

## Final confidence level

**High** — core document lifecycle is real and wired end-to-end (DB → API → manager UI), with explicit semantics enforcement and auditable approval history.

