# Plan-fit foundation

**Scope:** Step 1 — architectural and code foundation for monetization and plan-fit. No UI, checkout, or billing provider.

## Canonical plan model

- **Canonical plan codes (this foundation only):** `client_personal`, `team_contractor`, `business_operations`, `enterprise`.  
- **FREE, PRO, ENTERPRISE are not canonical naming for this foundation.** They belong to the legacy/current runtime billing tier layer (subscription service, entitlements table, Stripe). Do not use them as plan codes in the plan-fit layer. See `docs/architecture/SUBSCRIPTION_AND_CAPABILITY_MODEL.md`.
- **Location:** `packages/contracts` exports `PlanCode`, `PlanCodeSchema`; `apps/web/lib/platform/plan-fit/plans.ts` exposes `getPlanEntitlements(planCode)` and `PLAN_CODE_LABELS`.
- **Decision:** `client_personal` has `tasks: false` to separate client (transparency/photo/decisions) from full contractor execution flow. If product later unifies project model, this can be revisited and documented.

## Entitlement model

- **Limits:** `maxUsers`, `maxProjects`, `maxStorageGb`, `maxActiveMobileWorkers`, `maxMonthlyAiRequests`.
- **Capabilities:** Boolean flags for features (projects, tasks, approvals, documents, inspections, analytics, sso, etc.). Full list in `EntitlementCapabilities` in `apps/web/lib/platform/plan-fit/entitlements.types.ts`.
- **Source of truth:** `PLAN_ENTITLEMENTS_DEFAULTS` in `entitlements-config.ts`; capability layer reads from it (or from optional `entitlements` override when workspace has resolved subscription + add-ons).

## Capability layer

- **Rule:** All plan/entitlement checks go through `apps/web/lib/platform/plan-fit/capability.ts`. No ad-hoc `plan === "..."` checks elsewhere.
- **Helpers:** `getWorkspaceCapabilities`, `canCreateProject`, `canInviteUser`, `canUseMobileWorkerFlow`, `canUseApprovals`, `canUseAdvancedApprovals`, `canUseDocuments`, `canUseAdvancedDocuments`, `canUseInspections`, `canUsePortfolioAnalytics`, `canUseManagerAI`, `canUseIntegrations`, `canUseSSO`, `canUseApiAccess`, `canUseAuditLogs`, `hasReachedUserLimit`, `hasReachedProjectLimit`, `hasReachedStorageLimit`, `hasReachedAiLimit`.
- **Input:** `CapabilityInput`: `planCode`, optional `entitlements`, optional `usage` (for limit checks).

## Recommendation engine

- **Pure domain:** `recommendPlan(input)` in `recommend.ts`; input/output types in `recommend.types.ts`.
- **Output:** `recommendedPlanCode`, `alternativePlanCodes`, `enterpriseSignal`, `reasoningCodes`. No hard lock; alternatives always returned.
- **Rules:** See `docs/product/PLAN_RECOMMENDATION_RULES.md`.

## Add-ons (domain only)

- **Codes:** `extra_users`, `extra_projects`, `extra_storage`, `ai_expansion`, `premium_onboarding`, `premium_support`, `future_budget_cost`, `integration_pack`, `security_pack`, `sla_pack`.
- **Location:** `packages/contracts` (`AddOnCode`); `apps/web/lib/platform/plan-fit/add-ons.ts` (labels, `getAddOnConfig`). No pricing in this step.

## Application layer (Step 2): canonical plan to workspace

- **Applying canonical plan to workspace:** Use `resolveWorkspacePlanContext({ workspaceId, planCode } | { workspaceId, legacyTier })`. When source is legacy tier, bridge maps tier → plan code; then base entitlements + add-ons + overrides are resolved. Result is `WorkspacePlanContext` with effectiveEntitlements and effectiveCapabilities.
- **Add-ons on application layer:** `applyAddOnsToEntitlements(base, planCode, addOnCodes)` in `add-on-rules.ts`. Capacity add-ons (extra_users, extra_projects, extra_storage, ai_expansion) add fixed deltas to limits. Workflow add-ons (premium_onboarding, premium_support) set capability flags. Enterprise-grade add-ons (integration_pack, security_pack, sla_pack) are allowed only for business_operations and enterprise; for client_personal and team_contractor they are skipped with a warning. See `docs/architecture/PLAN_BRIDGE_AND_ENTITLEMENT_RESOLUTION.md`.

## Subscription domain types (foundation only)

- **Types:** `Subscription`, `WorkspaceEntitlements`, `PlanRecommendation`, `UsageCounters` in `domain.types.ts`. No persistence or billing provider in Step 1.
- **Relationship:** Existing `subscription.service` / `entitlements` table and FREE/PRO/ENTERPRISE tier are the **legacy runtime tier layer**. Plan-fit is the **canonical** model for new plan-based capabilities. Do not mix tier names with plan codes. Mapping from tier to plan code (or migration path) is out of scope for Step 1.

## Persistence and backend (Step 4)

- **Recommendation records:** Table `plan_fit_recommendations`; repository `createPlanRecommendation`, `getLatestPlanRecommendationForWorkspace`. Submit via `submitPlanFitRecommendation`; **recommendation does not auto-select plan.**
- **Selected plan state:** Table `workspace_plan_state`; repository `getWorkspaceSelectedPlanState`, `upsertWorkspaceSelectedPlanState`. Select via `selectWorkspacePlan`. **Selected canonical plan ≠ Billing subscription.**
- **Runtime priority:** Default adapter reads persisted selected plan first, then legacy tier, then safe default. See `docs/architecture/PLAN_FIT_PERSISTENCE_AND_BACKEND.md`.
- **API:** POST `/api/v1/plan-fit/recommend`, GET `/api/v1/plan-fit/recommend/latest`, POST `/api/v1/plan-fit/select`, GET `/api/v1/plan-fit/current`. Tenant-scoped; no checkout or billing.

## Post-registration orchestration (Step 5)

- **Purpose:** Server-side plan-fit state and next-step for post-registration / first-entry. No full onboarding UI; backend only.
- **Concepts:** Recommendation ≠ selection; selection ≠ billing; orchestration reads persistence + runtime + setup readiness and returns `orchestrationStatus`, `nextStep`, `canProceedToWorkspaceSetup`, `canProceedToDashboard`.
- **Setup readiness:** Same signal as activation/status: project count per tenant. `ready_for_dashboard` when at least one project; else `setup_incomplete`.
- **Legacy/transitional:** Workspace with projects but no recommendation and no selected plan → `dashboard_ready`, `open_dashboard` (do not block existing users).
- **API:** GET `/api/v1/plan-fit/orchestration`. See `docs/architecture/PLAN_FIT_ORCHESTRATION.md` and `PLAN_FIT_PERSISTENCE_AND_BACKEND.md`.

## Richer setup continuation (Step 7)

- **Distinction:** Plan selection (which plan the workspace chose) is separate from **workspace operational readiness** (whether the workspace has minimal setup to use the product).
- **Setup readiness v2:** `evaluateSetupReadinessV2()` in `orchestration/setup-readiness.evaluator.ts`. Checkpoints: `first_project_created`, `workspace_name_set`, `has_invited_or_collaborator`. Readiness kinds: `setup_missing` (no project, no name), `setup_incomplete` (no project, has name), `minimally_ready` (has project, missing name or invite), `ready_for_dashboard` (all done).
- **Setup continuation service:** `getWorkspaceSetupState(supabase, tenantId)` returns readiness, completedSteps, missingSteps, nextActionKey, targetRoute. Used by orchestration and can be exposed via API.
- **Orchestration payload:** Response includes optional `setup` with full v2 detail. Rules still use legacy `setup_incomplete` | `ready_for_dashboard` (minimally_ready maps to ready_for_dashboard); richer detail is for UI.
- **Legacy safety:** Workspaces with projects are never blocked; `minimally_ready` and `ready_for_dashboard` both allow dashboard access.

## Post-signup / post-login routing (Step 9)

- **Entry routing:** `resolvePostAuthEntry()` centralizes post-auth redirect. Safe `next` param preserved; invalid/absent → dashboard. No open redirects. See `docs/architecture/ENTRY_ROUTING_POLICY.md`.
- **Integration:** Middleware (auth-page redirect) and login page (post-auth client redirect) use the resolver.

## Plan surface and upgrade prompts (Step 10)

- **Current plan surface:** `getPlanSurfaceViewModel()` builds display model from `WorkspacePlanContext`. Limits summary, capability groups, upgrade suggestion.
- **API:** GET `/api/v1/plan-fit/surface` returns UI-ready summary. Legacy-safe; fallback on error.
- **UI:** Billing page shows full plan summary; dashboard topbar has plan badge linking to billing.
- **Soft upgrade:** CTA copy like "Explore plan options", "Contact us for enterprise rollout". No checkout, no paywall. See `docs/product/PLAN_SURFACE_AND_UPGRADE_PROMPTS.md`.

## Contextual upgrade prompts (Step 11)

- **Where prompts live:** Billing ("Available with higher plans"), Portfolio (capability gate for portfolioAnalytics), Approvals (inline hint for advancedApprovals).
- **Prompt builder:** `getUpgradePromptForCapability()` from plan surface. Capability mapping in `upgrade-prompt-config.ts`.
- **Safe CTA:** All prompts link to `/billing`. No checkout, no paywall. See `docs/architecture/CONTEXTUAL_UPGRADE_PROMPTS.md`.

## Onboarding UI shell (Step 6)

- **Entry:** Dashboard page uses `OnboardingGate`, which fetches orchestration. When `dashboard_ready` → dashboard content; when plan-fit steps → `PlanFitOnboardingShell`.
- **Flow:** collect_plan_fit_input (form) → submit recommendation → review_recommendation (show recommended + alternatives, CTA select) → select plan → continue_workspace_setup (CTA create project) or open_dashboard.
- **Client:** Thin layer in `lib/plan-fit/api-client.ts`; no orchestration logic on client. UI branches on `orchestration.nextStep` from server.
- **Screens:** PlanFitInputForm, ReviewRecommendationScreen, ContinueWorkspaceSetupScreen, OpenDashboardScreen, InconsistentStateScreen. See `components/onboarding/plan-fit/`.
- **Legacy safety:** `dashboard_ready` shows dashboard; orchestration API failure falls back to activation/status (projectCount > 0 → dashboard; else legacy OnboardingWizard).

## Continue workspace setup screen (Step 7)

- **Upgrade:** `ContinueWorkspaceSetupScreen` receives optional `setup` from orchestration. Shows completed steps, missing steps, and next-action CTA.
- **View-model:** Pure logic in `continue-workspace-setup.view-model.ts` (`getPrimaryCtaForSetup`, `getSetupChecklistViewModel`, `getStepButtonLabelKey`, `getContinueSetupSubtitleKey`, `getTargetRouteForAction`) for testability without DOM.
- **CTA routing:** `create_first_project` → `/projects/new`; `set_workspace_name` / `invite_team` → `/team`; `open_dashboard` → `/dashboard`.
- **No wizard:** Single screen with progress and one primary CTA; no multi-step wizard.

## Operational onboarding refinement (Step 8)

- **Operational milestones:** Plan selected; workspace name set; first project created; team/invite readiness; ready for dashboard. See `docs/product/OPERATIONAL_ONBOARDING_MVP.md`.
- **Setup checklist:** `getSetupChecklistViewModel()` returns ordered steps (workspace_name_set, first_project_created, has_invited_or_collaborator) with completed, isRecommended, route, descriptionKey.
- **Workspace profile:** Team page (`/team`) includes workspace name field; PATCH `/api/tenant/profile` updates `tenants.name`. Requires `tenant:settings` (admin/owner).
- **UI refinement:** Continue setup screen shows progress cards with per-step CTA, recommended-next badge, and contextual descriptions.

## Billing readiness layer (Step 12–15)

- **Provider-agnostic domain model:** BillingCustomer, BillingSubscription, BillingCheckoutSession, BillingEvent, TrialState.
- **Adapter layer:** `BillingProviderAdapter` interface; sandbox adapter by default. See `docs/architecture/BILLING_READINESS_ARCHITECTURE.md`.
- **Event processor (Step 14):** Sandbox complete/cancel flow uses internal billing event processor. Translation boundary, reconciliation rules, idempotency. Same processor path for future provider adapter. See `docs/architecture/BILLING_EVENT_PROCESSOR.md`.
- **Provider-ready boundary (Step 15–16):** Stripe adapter behind `ENABLE_STRIPE_BILLING_PROVIDER`. Live checkout behind `ENABLE_STRIPE_LIVE_CHECKOUT` (default OFF). Price mapping, return/cancel boundary. No default rollout. See `docs/architecture/STRIPE_ADAPTER_SKELETON.md`.
- **Provider webhook ingress (Step 17):** Real Stripe webhook at `POST /api/v1/billing/webhooks/stripe` behind `ENABLE_STRIPE_WEBHOOK_INGRESS` (default OFF). Signature verification, translation → record → canonical processor. Idempotency via provider_event_ref. No default rollout.
- **Controlled pilot rollout (Step 18, Step 19, Step 20):** Live billing (checkout + webhook) gated by workspace-level eligibility. Hybrid allowlist: DB `billing_pilot_workspaces` + env `BILLING_PILOT_WORKSPACE_IDS`. Internal ops: cohort management, workspace diagnostics, reprocess events. **Pilot E2E verification (Step 20):** `getBillingPilotExecutionStatus`, stage model, runbook (`docs/ops/BILLING_PILOT_RUNBOOK.md`). No global rollout; no self-serve. See `docs/architecture/BILLING_PILOT_ROLLOUT.md`.
- **Persistence:** `billing_readiness_*` tables (additive; no changes to legacy).
- **Separation:** Selected plan ≠ Billing subscription ≠ Effective entitlements.
- **API:** GET `/api/v1/billing/overview`, POST `/api/v1/billing/checkout-readiness`, POST `/api/v1/billing/webhooks/stripe`, POST `/api/v1/billing/sandbox/complete`, POST `/api/v1/billing/sandbox/cancel`, POST `/api/v1/admin/billing/process-pending-events`, GET `/api/v1/admin/billing/provider-status`, GET `/api/v1/admin/billing/pilot-status?workspaceId=...`.
- **No default provider integration, checkout, or payment capture.**

## Out of scope (Step 1–5)

- UI plan-fit wizard, onboarding screens, checkout, pricing page.
- DB migrations for billing runtime, Stripe/Paddle/RevenueCat, paywalls, CRM/sales flows.
- Production feature toggling rollout beyond this foundation.
