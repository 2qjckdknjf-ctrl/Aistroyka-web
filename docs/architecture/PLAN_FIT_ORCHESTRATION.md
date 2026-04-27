# Plan-fit orchestration (Step 5)

**Status:** Step 5 — post-registration orchestration flow. Backend only; no full onboarding UI, checkout, or billing.

## Purpose

Provide a server-side notion of plan-fit state and the correct next step for post-registration / first-entry so that a future onboarding UI (or other consumer) can:

- Know whether the workspace has a recommendation, a selected plan, and whether setup is ready.
- Get a single `orchestrationStatus` and `nextStep` to drive flows.
- Rely on legacy/transitional policy so existing workspaces are not blocked.

## Orchestration state model

- **workspaceId** — Tenant/workspace id.
- **hasRecommendation** / **latestRecommendation** — From `plan_fit_recommendations` (latest row).
- **hasSelectedPlan** / **selectedPlanState** — From `workspace_plan_state`.
- **currentPlanContext** — From runtime (adapter + `getWorkspacePlanContextFromRuntime`).
- **setupReadiness** — Legacy: `{ kind: "setup_incomplete" | "ready_for_dashboard", projectCount }`. Used by rules.
- **setup** — Optional richer detail (Step 7): `SetupReadinessV2` with `kind`, `completedSteps`, `missingSteps`, `nextActionKey`, `targetRoute`. For UI.
- **orchestrationStatus** — `no_recommendation` | `recommendation_ready` | `plan_selected` | `setup_ready` | `dashboard_ready` | `inconsistent_state`.
- **nextStep** — `collect_plan_fit_input` | `review_recommendation` | `select_plan` | `continue_workspace_setup` | `open_dashboard` | `resolve_inconsistent_state`.
- **canProceedToWorkspaceSetup** / **canProceedToDashboard** — Booleans from rules.
- **warnings** — e.g. invalid persistence data, runtime context failure.

## Rules (summary)

1. **Inconsistent** — Invalid recommendation or selected plan (e.g. bad plan code) → `inconsistent_state`, `resolve_inconsistent_state`; canProceed* false.
2. **Legacy operational** — No recommendation, no selected plan, but has projects → `dashboard_ready`, `open_dashboard` (do not block).
3. **New workspace** — No recommendation, no plan, no projects → `no_recommendation`, `collect_plan_fit_input`.
4. **Has recommendation, no plan** → `recommendation_ready`, `review_recommendation`.
5. **Has selected plan, setup incomplete** → `plan_selected`, `continue_workspace_setup`.
6. **Has selected plan, setup ready** → `setup_ready`, `open_dashboard`.

## Setup readiness

- **Legacy (rules):** `setup_incomplete` | `ready_for_dashboard`. `minimally_ready` and `ready_for_dashboard` both map to `ready_for_dashboard` for rules.
- **V2 (Step 7):** `evaluateSetupReadinessV2()` in `orchestration/setup-readiness.evaluator.ts`. Checkpoints: `first_project_created`, `workspace_name_set`, `has_invited_or_collaborator`. Kinds: `setup_missing`, `setup_incomplete`, `minimally_ready`, `ready_for_dashboard`.
- **Definitions:** `setup_missing` = no project, no workspace name; `setup_incomplete` = no project, has name; `minimally_ready` = has project, missing name or invite; `ready_for_dashboard` = all checkpoints done.
- **Legacy shortcut:** Workspaces with projects are never blocked; `projectCount > 0` → at least `minimally_ready`.
- **API payload:** Orchestration response includes optional `setup` with full v2 detail for UI.

## Operational onboarding (Step 8)

- **Setup action model:** UI view-model (`getSetupChecklistViewModel`) builds display model from setup detail: ordered steps, completed state, recommended next action, target routes.
- **Backend unchanged:** Orchestration payload already includes setup v2; UI builds checklist locally for richer display.

## Legacy / transitional policy

- Workspaces that already have projects and have never used plan-fit (no recommendation, no selected plan) must still be able to use the dashboard. The orchestration returns `dashboard_ready` and `open_dashboard` for them.
- No mass redirects; no forcing all users into the new plan-fit flow. The endpoint is read-only and does not perform redirects.

## API

- **GET /api/v1/plan-fit/orchestration** — Returns `PlanFitOrchestrationResponse` (Zod-validated). Tenant from request context; auth/tenant-safe.

## Inconsistent state handling

- If the latest recommendation row has an invalid `recommended_plan_code`, or the selected plan state has an invalid `canonical_plan_code`, the service treats this as inconsistent: `hasRecommendation`/`hasSelectedPlan` are false for the invalid entity, and if either was the only source, `isInconsistent` is true and rules return `inconsistent_state`.
- Runtime plan context failure (e.g. adapter throws) is caught; `currentPlanContext` is null and a warning is added; orchestration still returns a valid state.

---

## Entry routing (Step 9)

- **Policy:** Post-login/post-signup redirect uses `resolvePostAuthEntry()`. Explicit safe `next` wins; otherwise → `/{locale}/dashboard`. See `docs/architecture/ENTRY_ROUTING_POLICY.md`.
- **Sanitization:** `sanitizeNextRoute()` prevents open redirects; only internal safe paths allowed.
- **Integration:** Middleware and login page use the resolver for redirect targets.

## Plan surface (Step 10)

- **Surface API:** GET `/api/v1/plan-fit/surface` returns `PlanSurfaceViewModel` for UI display. Uses `getWorkspacePlanContextFromRuntime`; same source as orchestration for plan context.
- **Display model:** Current plan, limits, capability groups, soft upgrade CTA. No checkout or billing integration.

## Frontend consumption (Step 6)

- **OnboardingGate:** Wraps dashboard content. Fetches orchestration via `fetchOrchestration()` (GET `/api/v1/plan-fit/orchestration`). When `orchestrationStatus === "dashboard_ready"` → renders children (dashboard). When plan-fit steps → renders `PlanFitOnboardingShell` with orchestration + refetch.
- **PlanFitOnboardingShell:** Receives orchestration and refetch. Renders screen by `nextStep`: collect_plan_fit_input → PlanFitInputForm; review_recommendation/select_plan → ReviewRecommendationScreen; continue_workspace_setup → ContinueWorkspaceSetupScreen; open_dashboard → OpenDashboardScreen; resolve_inconsistent_state → InconsistentStateScreen.
- **API client:** `lib/plan-fit/api-client.ts` — `fetchOrchestration`, `submitRecommendation`, `selectPlan`, `fetchLatestRecommendation`, `fetchCurrentPlan`. No orchestration rules on client; all branching from server response.
- **Submit/select flow:** User submits form → `submitRecommendation` → refetch orchestration → UI shows review screen. User selects plan → `selectPlan` → refetch → UI shows continue or open_dashboard.
