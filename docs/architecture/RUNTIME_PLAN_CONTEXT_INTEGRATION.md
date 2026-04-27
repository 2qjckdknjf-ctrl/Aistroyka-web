# Runtime plan context integration (Step 3)

**Status:** Step 3 — runtime integration adapter layer. No UI, checkout, or billing provider.

## Purpose

Allow the app to obtain `WorkspacePlanContext` and effective capabilities from **current runtime data** (entitlements table, tenants.plan) via an adapter and service layer, without scattering tier checks.

## Runtime source model

- **WorkspacePlanRuntimeSource** (`runtime-source.types.ts`): workspaceId, legacyTier?, canonicalPlanCode?, addOnCodes?, usageSnapshot?, trialEndsAt?, overrides?, _meta?.
- Today the app has: tenantId (= workspaceId), tier from `getTierForTenant` (entitlements then tenants.plan). No canonical plan or add-ons in DB yet; they are optional in the source.

## Adapter layer

- **WorkspacePlanRuntimeAdapter** (`runtime-adapter.types.ts`): `getRuntimeSource(supabase, workspaceId)` → `Promise<WorkspacePlanRuntimeSource>`.
- **Default implementation (Step 4):** 1) Reads `workspace_plan_state` (persisted selected canonical plan). If row exists, returns source with `canonicalPlanCode`, `addOnCodes`, _meta.source = "workspace_plan_state". 2) Else calls `getTierForTenant(supabase, workspaceId)`, normalizes to LegacyTier, returns source with legacyTier and _meta.source = "entitlements_then_tenants". Adapter only normalizes; fallback and safe default applied in the service.

## Fallback order (documented and tested)

1. **Persisted canonical selected plan** — if adapter returns `canonicalPlanCode` from `workspace_plan_state`, use it (Step 4).
2. **Explicit canonical plan** — else if source has `canonicalPlanCode`, use it.
3. **Legacy tier bridge** — else if source has valid `legacyTier`, map via `tierToPlanCode(tier)`.
4. **Safe default** — else use `client_personal` (conservative; no silent upgrade).

Conflict: if both canonical plan and legacy tier are set, **canonical wins** and a warning is recorded.

## Where adapter ends and resolver begins

- **Adapter:** Reads from DB/runtime, returns normalized `WorkspacePlanRuntimeSource`. Stops at the boundary of “what the app has”.
- **Service** (`runtime-plan-context.service.ts`): Takes source, applies fallback order and conflict rule, builds `ResolveWorkspacePlanContextInput`, calls `resolveWorkspacePlanContext(input)` (Step 2), returns `WorkspacePlanContext`. No DB access in the resolver itself.

## Runtime service entrypoints

- **getWorkspacePlanContextFromRuntime(supabase, workspaceId, options?)**  
  Loads source via adapter (default: entitlements/tenants), applies fallback, returns `WorkspacePlanContext`. Options: custom adapter, includeMetaInNotes.
- **getWorkspaceCapabilitiesFromRuntime(supabase, workspaceId, options?)**  
  Same load, then `resolveWorkspaceCapabilities(context)`; returns `WorkspaceCapabilitySnapshot`.
- **requireWorkspaceCapability(supabase, workspaceId, capabilityKey, options?)**  
  Same load; throws `WorkspaceCapabilityRequiredError` if the capability is not true.

## Error / warning model

- **RuntimePlanWarning** (runtime-errors.types.ts): code (workspace_plan_source_missing, unsupported_legacy_tier, invalid_add_on_code, inconsistent_runtime_plan_data, usage_snapshot_unavailable), message.
- Warnings are collected during normalization (e.g. invalid add-on, both plan and tier set). Optionally appended to context.notes via `includeMetaInNotes`.
- **WorkspaceCapabilityRequiredError**: thrown by `requireWorkspaceCapability` when the workspace does not have the required capability.

## Safe default and missing data

- Workspace found but no tier/plan → safe default `client_personal`; warning `workspace_plan_source_missing`.
- Unknown/invalid add-on code → skipped; warning `invalid_add_on_code`.
- Usage snapshot unavailable → leave undefined; limit checks remain permissive (not reached).

## Integration points (minimal)

- **Estimate from image** (`app/api/v1/projects/[id]/estimate/from-image/route.ts`): Uses `getWorkspacePlanContextFromRuntime(supabase, ctx.tenantId)` instead of `getTierForTenant`. Passes `(context.sourceLegacyTier ?? "FREE").toLowerCase()` to existing `analyzeImageForCost` so behavior stays the same and the path goes through the new layer.
- New server code that needs plan or capabilities should call `getWorkspacePlanContextFromRuntime` or `getWorkspaceCapabilitiesFromRuntime`; no direct `getTierForTenant` for plan-aware flows.
