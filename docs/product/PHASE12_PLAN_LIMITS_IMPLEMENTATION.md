# Phase 12 — Plan limits implementation

**Purpose:** Describe where subscription limits and plan capabilities live, how they are enforced today, and what to consolidate next.

## Two numerical models (known gap)

1. **Legacy subscription limits** — `apps/web/lib/platform/subscription/limits.ts` (`FREE` / `PRO` / `ENTERPRISE`): `max_projects`, `max_workers`, `storage_limit_gb`, AI budget, rate limits. Overrides persist in `public.entitlements` (`getEntitlements`, `limitsFromEntitlements` in `apps/web/lib/platform/billing/entitlements.service.ts`).
2. **Canonical plan-fit defaults** — `apps/web/lib/platform/plan-fit/entitlements-config.ts` keyed by **PlanCode** (`client_personal`, `team_contractor`, `business_operations`, `enterprise`): `maxUsers`, `maxProjects`, `maxStorageGb`, `maxActiveMobileWorkers`, `maxMonthlyAiRequests` plus capability flags.

The bridge maps tier → PlanCode (`bridge.ts`: `FREE` → `client_personal`, `PRO` → `team_contractor`, `ENTERPRISE` → `enterprise`). **Numeric limits are not automatically unified** between (1) and (2); product and engineering should pick one runtime source or derive (2) from (1) + overrides in a single resolver.

## Enforcement (runtime API / product)

| Concern | Mechanism | Notes |
|--------|-----------|--------|
| Project count cap | `createProject` in `apps/web/lib/domain/projects/project.service.ts` uses `getLimitsForTenant` + `countByTenant` on `projects`. | Returns 403-style error text containing `Insufficient quota` when at limit (see `POST /api/projects`). |
| AI spend / rate | Tier on tenant + `entitlements`; copilot / AI gates (e.g. `gateCopilotLlmRequest`). | See `apps/web/lib/copilot/copilot-ai-gate.ts` and subscription limits. |
| Capability flags | `plan-fit/capability.ts` (`canUseManagerAI`, `canUseAdvancedApprovals`, etc.). | Should be used at feature entry points; grep for call sites when hardening. |
| User / worker / storage caps | Partially modeled in plan-fit helpers (`canInviteUser`, storage helpers); **not all invitation paths verified here.** | Next hardening: tenant invitation APIs + worker assignment. |

## Business (`business_operations`) and billing

- **PlanCode** `business_operations` exists in contracts and entitlements config.
- **Legacy tier set** is only three values. Introducing Business as a sellable SKU requires: Stripe/price mapping, webhook → `entitlements` + canonical `planCode` on workspace, and optional `tenants.plan` extension or parallel column — **design before changing production billing**.

## Testing

- Plan-fit logic: `apps/web/lib/platform/plan-fit/capability.test.ts` (and related plan-fit tests).
- Entitlements merge: `apps/web/lib/platform/billing/entitlements.service.test.ts`.

## Done criteria checklist (Phase 12 product)

- [x] Features mapped to plans in business doc and this implementation map.
- [x] At least one **hard** limit enforced at API (project creation).
- [ ] Align numeric limits between `limits.ts` and `entitlements-config.ts` (or single resolver).
- [ ] Enforce user/worker/storage consistently on write paths.
- [x] Public pricing page shows four named tiers without implying internal finance to customers.
- [ ] Enterprise claims match released capabilities.
