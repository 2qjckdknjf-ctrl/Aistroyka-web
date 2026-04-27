# Subscription and capability model

**Status:** Step 1 + Step 2. Aligns with ADR-033 (billing/entitlements) and plan-fit foundation. Step 2 adds mapping bridge and entitlement resolution.

## Canonical vs legacy: single source of truth

- **Canonical source of truth for the new plan-fit foundation**  
  - Plan codes: `client_personal`, `team_contractor`, `business_operations`, `enterprise` (from `packages/contracts` and `apps/web/lib/platform/plan-fit`).  
  - Entitlement defaults, capability layer, recommendation engine, and subscription domain types live in `apps/web/lib/platform/plan-fit`.  
  - For any *new* plan-based features and capability checks, this is the only canonical model.

- **Legacy / current runtime billing tier layer**  
  - `SubscriptionTier` (FREE, PRO, ENTERPRISE) and `TenantLimits` in `packages/contracts` and `apps/web/lib/platform/subscription` + `apps/web/lib/platform/billing`.  
  - Used by current runtime: entitlements table, Stripe webhook (ADR-033), `getTierForTenant`, `getLimitsForTenant`, `limitsFromEntitlements`.  
  - This is the **legacy tier model**; it is **not** the canonical naming for the new plan-fit foundation.

- **Mapping bridge (Step 2)**  
  - Transitional mapping FREE → client_personal, PRO → team_contractor, ENTERPRISE → enterprise. See `docs/architecture/PLAN_BRIDGE_AND_ENTITLEMENT_RESOLUTION.md`.  
  - Runtime can still resolve limits from legacy layer; when app needs plan-based capabilities, use bridge then canonical resolution.

- **Do not mix the two models directly**  
  - Do not use FREE/PRO/ENTERPRISE as plan codes in the plan-fit layer.  
  - Do not use `client_personal` / `team_contractor` / etc. in the legacy billing/subscription service without a dedicated mapping layer.  
  - A mapping layer (tier ↔ plan code) is out of scope for Step 1; it belongs to a later step.

## Layers

1. **Contracts (shared)**  
   `packages/contracts`: `PlanCode`, `AddOnCode`, `EntitlementLimits` (plan-fit schema). Existing `SubscriptionTier` (FREE/PRO/ENTERPRISE) and `TenantLimits` remain for **current billing integration only** (legacy tier layer).

2. **Plan-fit (apps/web)**  
   `apps/web/lib/platform/plan-fit`: **canonical** plan model, entitlement defaults, capability layer, recommendation engine, subscription domain types (no persistence in Step 1).
   - **Single capability gate:** All checks go through the capability layer; no scattered `plan === "..."` checks.

3. **Existing subscription/billing (legacy tier layer)**  
   `apps/web/lib/platform/subscription` and `apps/web/lib/platform/billing`: tier-based limits (FREE/PRO/ENTERPRISE), entitlements table, Stripe webhook (ADR-033). These stay; they are **not** the plan-fit model. Future work may add a mapping tier → plan or migrate to plan-first.

## Domain types (foundation)

- **Subscription:** id, workspaceId, planCode, billingCycle, status, provider, externalSubscriptionId, trial dates, period start/end. Types only in Step 1.
- **WorkspaceEntitlements:** workspaceId, sourcePlanCode, addOnCodes, limits, capabilities, effectiveFrom/To.
- **PlanRecommendation:** id, userId, workspaceId?, inputSnapshot, recommendedPlanCode, alternativePlanCodes, enterpriseSignal, reasoningCodes, createdAt.
- **UsageCounters:** workspaceId, activeUsersCount, activeProjectsCount, storageUsedGb, aiRequestsCount, periodKey.

## Capability resolution

1. Prefer workspace-resolved entitlements (e.g. from subscription + add-ons) when available.
2. Else use `getPlanEntitlements(planCode)` from plan defaults.
3. Limit checks use optional `usage` snapshot; when absent, "reached limit" returns false (permissive).

## Effective entitlement resolution (Step 2)

- **Flow:** Legacy tier (if any) → bridge → plan code → `resolveBasePlanEntitlements` → `applyAddOnsToEntitlements` → optional overrides → effective limits/capabilities.
- **Workspace plan context:** `resolveWorkspacePlanContext(input)` builds `WorkspacePlanContext` (workspaceId, canonicalPlanCode, sourceKind, effectiveEntitlements, effectiveCapabilities, usageSnapshot, etc.). Entrypoint for onboarding, gating, upgrade prompts.
- **Application-layer capability:** `resolveWorkspaceCapabilities(context)` returns runtime capability snapshot from context. Capabilities are computed from effective entitlements only; legacy tier is never fed directly into capability logic.
- **Where legacy ends:** Legacy tier layer ends at subscription service / entitlements table output. Canonical resolution starts when building WorkspacePlanContext or effective entitlements: always go through bridge then plan-fit resolver.

## Plan-fit persistence (Step 4)

- **Recommendation records:** Table `plan_fit_recommendations` stores recommendation results (input snapshot, recommended plan, alternatives, reasoning). Recommendation ≠ selection; submitting does not change selected plan.
- **Selected plan state:** Table `workspace_plan_state` stores selected canonical plan per workspace (tenant_id, canonical_plan_code, source_kind, add_on_codes). **Selected canonical plan ≠ Billing subscription.** Billing remains in entitlements/billing_customers. See `docs/architecture/PLAN_FIT_PERSISTENCE_AND_BACKEND.md`.
- **Runtime priority:** Persisted selected plan (if any) is read first by the default adapter; then legacy tier; then safe default.

## Runtime integration (Step 3)

- **Runtime source:** Adapter reads current app data (e.g. `getTierForTenant` → legacyTier). Type: `WorkspacePlanRuntimeSource` (workspaceId, legacyTier?, canonicalPlanCode?, addOnCodes?, usageSnapshot?, etc.). See `docs/architecture/RUNTIME_PLAN_CONTEXT_INTEGRATION.md`.
- **Runtime source order / fallback:** 1) Explicit canonical plan from source. 2) Legacy tier → bridge → plan code. 3) Safe default `client_personal`. Conflict (both plan and tier set): canonical wins, warning recorded.
- **Where WorkspacePlanContext is assembled in runtime:** `getWorkspacePlanContextFromRuntime(supabase, workspaceId)` loads source via `WorkspacePlanRuntimeAdapter` (default: entitlements then tenants), applies fallback, calls `resolveWorkspacePlanContext`, returns `WorkspacePlanContext`. Server-side only.
- **Capability from runtime:** `getWorkspaceCapabilitiesFromRuntime(supabase, workspaceId)` and `requireWorkspaceCapability(...)` for guard clauses.

## Out of scope (Step 1–3)

- DB migrations for subscription runtime, billing provider integration, paywall UI, pricing page, onboarding wizard.
