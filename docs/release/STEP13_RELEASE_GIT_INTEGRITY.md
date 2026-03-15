# Step 13 Release — Git Integrity

**Date:** 2025-03-14

---

## A1. Inspection (at sprint start)

| Item | Value |
|------|--------|
| Current branch | ops/external-setup-attempt |
| Tracking | origin/ops/external-setup-attempt |
| Remote | origin (git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git) |
| Modified (M) | 76+ files |
| Staged (A/AM) | alert-fallback-href, priority-actions, resource-links, STEP11 build docs |
| Untracked (??) | 100+ paths including Step 13 cost layer, docs/db, docs/product, scripts |

### Critical untracked for Step 13 / release

- apps/web/app/api/v1/projects/[id]/costs/
- apps/web/app/api/v1/projects/[id]/milestones/
- apps/web/app/api/v1/projects/[id]/documents/
- apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectCostsPanel.tsx
- apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx
- apps/web/lib/domain/costs/
- apps/web/lib/domain/milestones/
- apps/web/lib/domain/documents/
- apps/web/scripts/verify-cost-runtime.mjs, verify-cost-migration.mjs, apply-step13-only.mjs
- apps/web/supabase/migrations/20260307000000_*.sql through 20260307500000_*.sql
- docs/db/ (migration reconciliation)
- docs/product/STEP13_FINAL_*
- docs/release/STEP13_RELEASE_*

### Modified required for release

- docs/pilot-launch/DB_MIGRATION_APPLY_SEQUENCE.md (reconciliation path)
- apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx (costs tab)
- apps/web/vercel.json, scripts/run-migrations.mjs

---

## A2. Release checklist (must be committed)

1. Step 13 cost layer: costs API routes, ProjectCostsPanel, domain/costs, cost-signals service.
2. Supporting surface: milestones/documents API, panels, domain modules.
3. Migrations: 20260307* (contact_leads through project_cost_items).
4. Scripts: verify-cost-runtime.mjs, verify-cost-migration.mjs, apply-step13-only.mjs.
5. Migration governance: docs/db/*, DB_MIGRATION_APPLY_SEQUENCE.md.
6. Step 13 product/runtime docs: docs/product/STEP13_FINAL_*.
7. Release reconciliation docs: docs/release/STEP13_RELEASE_*.
8. Dashboard/vercel/migrations: DashboardProjectDetailClient, vercel.json, run-migrations.mjs.

Excluded from commit: android build dirs, gradle wrapper jar, other build artifacts; .env*; temporary files.

---

## A3. Commit strategy

- Single reconciliation commit or logical grouping (e.g. Step 13 code + docs, then release docs).
- Message: "chore(release): Step 13 reconciliation — cost layer, migration governance, release docs"

---

## A4. Push

- Push to origin/ops/external-setup-attempt after commit.
- No force push; no history rewrite.
