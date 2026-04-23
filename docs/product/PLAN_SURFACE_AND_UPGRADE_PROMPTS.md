# Plan surface and upgrade prompts (Step 10)

**Status:** Step 10 — trial / upgrade surface without checkout.

## Purpose

Provide a canonical display layer for the current plan, limits, and capabilities. Soft upgrade prompts without checkout, paywall, or billing integration.

## Plan surface model

- **View model:** `getPlanSurfaceViewModel(context)` in `lib/platform/plan-fit/plan-surface.ts`.
- **Input:** `WorkspacePlanContext` from runtime (persisted plan or legacy bridge).
- **Output:** `PlanSurfaceViewModel` with:
  - `currentPlanCode`, `humanReadablePlanName`, `sourceKind`, `sourceLabel`
  - `planDescriptionShort`
  - `limitsSummary` (users, projects, storage, mobile workers, AI requests)
  - `capabilityGroups` (collaboration, reporting, approvals & docs, analytics & AI, enterprise controls)
  - `upgradeSuggestion` (suggested plan, CTA variant, copy)
  - `isEnterprise`, `isLegacyBridge`

## Copy layer

- **Plan display:** `PLAN_DISPLAY_COPY` in `plan-surface-copy.ts` — name, descriptionShort, featureBullets per plan.
- **Upgrade CTA:** `UPGRADE_CTA_COPY` — honest, non-billing copy:
  - `explore_plans` — "Explore plan options"
  - `see_business_options` — "Explore Business Operations"
  - `contact_enterprise` — "Contact us for enterprise rollout"
  - `managed_plan` — "Contact support or onboarding team"
  - `none` — enterprise, no upgrade prompt

## API

- **GET /api/v1/plan-fit/surface** — Returns `{ surface: PlanSurfaceViewModel, fallback?: boolean }`.
- Uses `getWorkspacePlanContextFromRuntime`; on error returns safe fallback (client_personal).

## UI surface

- **Billing page** (`/billing`): `CurrentPlanSurface` — full plan summary, limits, capability groups, soft upgrade CTA.
- **Dashboard topbar:** `PlanBadge` — compact plan name linking to billing.
- **Sidebar:** Billing link added to dashboard nav.

## Upgrade / trial policy

- No checkout, no paywall, no billing provider.
- CTA copy: "Explore plan options", "Review available plans", "Contact us for enterprise rollout".
- No misleading "start free trial" that implies billing.
- Upgrade suggestion by tier: client_personal → team_contractor; team_contractor → business_operations; business_operations → enterprise; enterprise → managed_plan (contact support).

## Legacy safety

- Legacy users (sourceKind `legacy_tier_bridge`) see "Legacy plan (mapped)" label.
- Fallback uses client_personal when context fetch fails.
- No forced upgrade; surface is informational only.

## Contextual upgrade prompts (Step 11)

- **Prompt model:** `getUpgradePromptForCapability(capabilityKey, surface)` builds `UpgradePromptViewModel`.
- **Capability mapping:** advancedApprovals, advancedDocuments, portfolioAnalytics, managerAi, integrations, sso, auditLogs, apiAccess.
- **Integration points:** Billing ("Available with higher plans"), Portfolio (capability gate), Approvals (inline hint).
- **CTA:** Always `/billing`. No checkout/paywall. See `docs/architecture/CONTEXTUAL_UPGRADE_PROMPTS.md`.

## Relation to future billing (Step 12)

- Upgrade surface and prompts are **independent** of billing subscription state.
- Effective entitlements currently derive from **selected plan** (workspace_plan_state) + runtime rules.
- Future billing integration: billing subscription may confirm/override selected plan; effective entitlements may consider billing status.
- Billing readiness layer (`docs/architecture/BILLING_READINESS_ARCHITECTURE.md`) prepares provider-agnostic contracts; no real checkout yet.
