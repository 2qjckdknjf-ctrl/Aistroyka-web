# Wave 4 Step 4 — Executive summary

## Outcome

Aistroyka now has a **controlled budget / cost visibility layer**: cost line items with planned vs actual, project-level aggregates, explainable pressure signals, and manager-facing surfaces integrated with project summary and AI truth snapshot flags—without ERP, invoicing, or procurement.

## Key implementation references

- **DB:** `apps/web/supabase/migrations/20260307500000_project_cost_items.sql`
- **Domain:** `apps/web/lib/domain/costs/` (`cost.types.ts`, `cost.repository.ts`, `cost.service.ts`, `cost-signals.ts`)
- **Summary:** `apps/web/lib/domain/projects/project-summary.repository.ts`
- **Status:** `apps/web/lib/domain/projects/project-status.service.ts`
- **API:** `apps/web/app/api/v1/projects/[id]/costs/`, `.../summary`
- **UI:** `ProjectCostsPanel.tsx`, `DashboardProjectDetailClient.tsx`
- **Truth snapshot:** `project-truth-snapshot.assembler.ts`, `project-truth-snapshot.types.ts`

## Deferred (by design)

ERP connectors, accounting/tax, invoicing, procurement, Android expansion, enterprise analytics.

See sibling `WAVE4_STEP4_COST_*.md` files for stage detail and `WAVE4_STEP4_COST_POST_AUDIT.md` for closure classification.
