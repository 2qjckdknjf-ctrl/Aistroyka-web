# Plan bridge and entitlement resolution (Step 2)

**Status:** Step 2 — mapping + entitlement resolution + application layer. No UI, checkout, or billing provider.

## Mapping bridge (legacy tier → canonical plan)

- **Purpose:** Transitional, deterministic bridge from legacy runtime tier (FREE/PRO/ENTERPRISE) to canonical plan code. Not the final business model.
- **Location:** `apps/web/lib/platform/plan-fit/bridge.ts`.
- **Mapping:**
  - FREE → `client_personal` (minimal tier = minimal plan; single/small usage).
  - PRO → `team_contractor` (mid tier = team execution; projects/workers align).
  - ENTERPRISE → `enterprise`.
- **API:** `tierToPlanCode(tier)`, `mapLegacyTierToPlan(tier)`. Use only when input is legacy tier; do not pass plan codes into the bridge.
- **Documentation:** This doc; see also SUBSCRIPTION_AND_CAPABILITY_MODEL.md.

## Effective entitlement resolution

- **Source of truth:** Canonical plan-fit model. Legacy tier never directly determines capabilities; it is mapped to plan code first.
- **Flow:**
  1. Resolve canonical plan: either explicit `planCode` or `legacyTier` → bridge → `planCode`.
  2. `resolveBasePlanEntitlements(planCode)` → base limits and capabilities.
  3. `applyAddOnsToEntitlements(base, planCode, addOnCodes)` → effective limits/capabilities (with allowed-add-on rules).
  4. Optional overrides applied last.
- **API:** `resolveBasePlanEntitlements`, `resolveEffectiveWorkspaceEntitlements` in `resolve.ts`. Input: planCode, addOnCodes, optional usage, optional overrides.

## Add-on application rules

- **Capacity add-ons** (any plan): `extra_users` (+10), `extra_projects` (+5), `extra_storage` (+50 GB), `ai_expansion` (+2000 AI requests). Add to plan base.
- **Workflow/support add-ons** (any plan): `premium_onboarding` → assistedOnboarding; `premium_support` → prioritySupport.
- **Enterprise-grade add-ons** (business_operations and enterprise only): `integration_pack` → integrations; `security_pack` → auditLogs; `sla_pack` → sla. For client_personal and team_contractor these are **skipped** with a warning.
- **future_budget_cost:** No entitlement effect (meta only); documented.
- **Restriction:** Add-ons do not turn client_personal into full enterprise; capability grants are limited by plan.

## Workspace plan context

- **Type:** `WorkspacePlanContext` in `workspace-plan-context.types.ts`.
- **Fields:** workspaceId, canonicalPlanCode, sourceKind (canonical_plan | legacy_tier_bridge | override), sourceLegacyTier?, addOnCodes, effectiveEntitlements, effectiveCapabilities, usageSnapshot?, trialEndsAt?, notes?.
- **Assembly:** `resolveWorkspacePlanContext(input)` / `getWorkspacePlanContext(input)`. Input: workspaceId + either planCode or legacyTier, addOnCodes, usageSnapshot, trialEndsAt, overrides. No DB; pure resolution.

## Capability resolution in application layer

- **API:** `resolveWorkspaceCapabilities(context)` in `application-capability.ts`. Takes `WorkspacePlanContext`, returns `WorkspaceCapabilitySnapshot` (limits + capabilities).
- **Rule:** Application layer uses context; canonical capability helpers (canCreateProject, etc.) remain in capability.ts and are invoked with effective entitlements from context. No direct tier checks in app logic.

## Where legacy ends and canonical resolution starts

- **Legacy tier layer** ends at: subscription service, entitlements table, Stripe webhook, `getTierForTenant`, `getLimitsForTenant`. Output: tier (FREE/PRO/ENTERPRISE) and/or legacy limits.
- **Canonical resolution starts** when: app needs plan-based capabilities or effective entitlements. Then: tier → bridge → planCode → resolveEffectiveWorkspaceEntitlements → WorkspacePlanContext → resolveWorkspaceCapabilities. Do not feed FREE/PRO/ENTERPRISE into capability logic; only feed plan code and effective entitlements.

## Runtime adapter (Step 3)

- **Bridge usage in runtime:** The default runtime adapter (`default-runtime-adapter.ts`) calls `getTierForTenant` (legacy layer), then the runtime service normalizes to `LegacyTier` and passes it as `legacyTier` into `resolveWorkspacePlanContext`. The bridge is invoked inside `resolveWorkspacePlanContext` (Step 2) when input has `legacyTier` and no `planCode`.
- **Where adapter ends:** Adapter only returns `WorkspacePlanRuntimeSource` (workspaceId, legacyTier, etc.). It does not call the bridge or resolver.
- **Where resolver begins:** The runtime service (`runtime-plan-context.service.ts`) takes the source, applies fallback order, builds `ResolveWorkspacePlanContextInput`, and calls Step 2 `resolveWorkspacePlanContext`, which uses the bridge when `legacyTier` is set.
