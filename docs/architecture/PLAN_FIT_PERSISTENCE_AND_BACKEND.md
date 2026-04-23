# Plan-fit persistence and backend (Step 4)

**Status:** Step 4 — persistence + plan-fit backend flow. No UI, checkout, or billing provider.

## Rules (documented)

1. **Recommendation ≠ Selection** — Submitting a recommendation persists a record; it does not change the selected plan. Selection is a separate action (POST select).
2. **Selected canonical plan ≠ Billing subscription** — `workspace_plan_state` stores the user’s chosen plan for capability resolution. It is not the billing subscription (entitlements table, Stripe). Billing status is not introduced in this step.
3. **Persisted canonical selected plan has priority** — Runtime adapter (Step 4) reads `workspace_plan_state` first. If present, that plan is used; else legacy tier bridge; else safe default.
4. **Legacy tier remains fallback** — Until a later migration, legacy tier (entitlements/tenants.plan) is used only when no persisted selected plan exists.
5. **No checkout / no billing activation on this step** — Backend only; no payment or subscription activation.

## Persistence model

### plan_fit_recommendations

- **Purpose:** Store recommendation results (history/snapshot per workspace). One row per submission.
- **Columns:** id, tenant_id, user_id (nullable), input_snapshot (jsonb), recommended_plan_code, alternative_plan_codes (jsonb), enterprise_signal, reasoning_codes (jsonb), created_at.
- **Location:** `apps/web/supabase/migrations/20260319100000_plan_fit_persistence.sql`.
- **Access:** Repository `createPlanRecommendation`, `getLatestPlanRecommendationForWorkspace`. RLS: tenant members can select and insert.

### workspace_plan_state

- **Purpose:** Store selected canonical plan per workspace (tenant). One row per tenant (upsert).
- **Columns:** tenant_id (PK), canonical_plan_code, source_kind (recommendation_selected | admin_override | imported_legacy | manual_backend_set), selected_by_user_id (nullable), selected_at, add_on_codes (jsonb), created_at, updated_at.
- **Access:** Repository `getWorkspaceSelectedPlanState`, `upsertWorkspaceSelectedPlanState`. RLS: tenant members can select, insert, update.
- **Not billing:** This table is independent of `entitlements` and `billing_customers`.

## Backend flow

- **submitPlanFitRecommendation(tenantId, userId, input)** — Runs `recommendPlan(input)`, persists row in `plan_fit_recommendations`, returns recommendation + id. Does not update selected plan.
- **selectWorkspacePlan(tenantId, canonicalPlanCode, sourceKind?, selectedByUserId?, addOnCodes?)** — Validates plan code and add-ons (allowed per plan), upserts `workspace_plan_state`. Idempotent.
- **getWorkspaceSelectedPlan(tenantId)** — Returns persisted state or null.
- **getWorkspaceLatestPlanRecommendation(tenantId)** — Returns latest recommendation record or null.

## API (server entrypoints)

- **POST /api/v1/plan-fit/recommend** — Body: PlanFitRecommendRequestSchema. Persists recommendation; returns id, recommendedPlanCode, alternativePlanCodes, enterpriseSignal, reasoningCodes, createdAt. Tenant-scoped; requires canManageProjects.
- **GET /api/v1/plan-fit/recommend/latest** — Returns latest recommendation for current tenant or { recommendation: null }.
- **POST /api/v1/plan-fit/select** — Body: PlanFitSelectRequestSchema (canonicalPlanCode, sourceKind?, addOnCodes?). Upserts selected plan. Tenant-scoped; requires canManageProjects.
- **GET /api/v1/plan-fit/current** — Returns current selected plan state for tenant or { current: null }.

All routes use `getTenantContextFromRequest`, `requireTenant`, and tenant-scoped Supabase client. No cross-tenant access.

## Runtime priority (Step 4 update)

Default adapter order:

1. **Persisted canonical selected plan** — `getWorkspaceSelectedPlanState(supabase, workspaceId)`. If row exists → source.canonicalPlanCode (+ addOnCodes).
2. **Legacy tier bridge** — `getTierForTenant` → source.legacyTier.
3. Service layer applies safe default if neither is set.

Conflict between persisted plan and legacy tier is not possible in the adapter (only one path is used). If in future multiple sources are merged elsewhere, canonical plan must win over legacy tier.

---

## Orchestration layer (Step 5)

- **Service:** `getWorkspacePlanFitOrchestrationState(supabase, workspaceId)` in `apps/web/lib/platform/plan-fit/orchestration/orchestration.service.ts`. Aggregates: latest recommendation, selected plan state, runtime plan context (via existing adapter), setup readiness (project count).
- **Rules:** `orchestration-rules.ts` computes `orchestrationStatus` and `nextStep` from hasRecommendation, hasSelectedPlan, setupReadiness, isInconsistent. Legacy policy: no rec + no plan + has projects → dashboard_ready. Inconsistent (e.g. invalid plan code in persistence) → inconsistent_state, resolve_inconsistent_state.
- **Setup readiness:** `evaluateSetupReadiness(supabase, tenantId)` in `setup-readiness.evaluator.ts`; one query to projects count. Does not replace `/api/activation/status`; used only by orchestration.
- **Endpoint:** GET `/api/v1/plan-fit/orchestration` returns validated `PlanFitOrchestrationResponse`. Auth/tenant-safe; no redirects.
