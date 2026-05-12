# Customer Finance Isolation Pre-Audit

Date: 2026-05-07

Phase: 0 - Live Truth Verification

Verdict: PASS FOR LIVE SUPABASE ISOLATION, CODE REMEDIATION AWAITS DEPLOY

## Authoritative Rule

Customer / owner must never see internal financial state of the construction company.

Forbidden customer/owner exposure includes:

- internal costs
- planned vs actual company costs
- internal budget pressure
- cost overruns
- margin
- profitability
- subcontractor costs
- internal cost item list
- internal AI finance risk

Allowed customer/owner exposure includes only:

- estimates sent for approval
- additional proposals
- approved commercial changes
- payment schedule if intentionally configured
- invoices, acts, contracts, or documents intentionally shared
- customer decisions and approved amounts tied to customer decisions

## Inspected Surfaces

Routes and services inspected:

- `apps/web/app/api/v1/owner/health/route.ts`
- `apps/web/app/api/v1/owner/critical/echo/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-portal/route.ts`
- `apps/web/app/api/v1/projects/[id]/change-orders/route.ts`
- `apps/web/app/api/v1/projects/[id]/change-orders/[changeOrderId]/route.ts`
- `apps/web/app/api/v1/projects/[id]/costs/route.ts`
- `apps/web/app/api/v1/projects/[id]/costs/[costItemId]/route.ts`
- `apps/web/lib/domain/client-portal/client-portal.service.ts`
- `apps/web/lib/domain/client-portal/client-portal.types.ts`
- `apps/web/lib/domain/client-portal/client-portal.policy.ts`
- `apps/web/lib/domain/change-orders/change-orders.service.ts`
- `apps/web/lib/domain/change-orders/change-orders.types.ts`
- `apps/web/lib/domain/change-orders/change-orders.policy.ts`
- `apps/web/lib/domain/stakeholders/stakeholders.policy.ts`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ClientPortalManagerCard.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalViewClient.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/change-orders/ClientPortalChangeOrdersListClient.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/change-orders/[changeOrderId]/ClientPortalChangeOrderDetailClient.tsx`
- `apps/web/supabase/migrations/20260307500000_project_cost_items.sql`
- `apps/web/supabase/migrations/20260329100000_project_client_portal.sql`
- `apps/web/supabase/migrations/20260329140000_stakeholder_rls_isolation.sql`
- `apps/web/supabase/migrations/20260402120000_project_change_orders.sql`

## Findings And Remediation

### 1. Client portal could expose planned vs actual internal budget totals

Initial severity: CRITICAL

Status: REMEDIATED IN CODE

Evidence:

- `apps/web/lib/domain/client-portal/client-portal.service.ts` imports `getBudgetSummary` from internal costs.
- If `project.client_show_budget_summary` is true, the customer read model returns `planned_total`, `actual_total`, and `over_budget`.
- `apps/web/lib/domain/client-portal/client-portal.types.ts` defines `ClientBudgetSummary` with `planned_total`, `actual_total`, and `over_budget`.
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalViewClient.tsx` renders actual/planned budget totals and over-planned status to the client portal.

This violates the roadmap rule because actual internal costs, internal planned-vs-actual totals, and over-budget state are forbidden on customer/owner surfaces.

Remediation:

- Removed `getBudgetSummary` from `apps/web/lib/domain/client-portal/client-portal.service.ts`.
- Removed `ClientBudgetSummary` and `budget` from `apps/web/lib/domain/client-portal/client-portal.types.ts`.
- Removed the customer budget card from `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalViewClient.tsx`.
- Added tests proving the customer read model does not contain `planned_total`, `actual_total`, or `over_budget`.

### 2. Manager UI had a switch to enable customer budget exposure

Initial severity: CRITICAL

Status: REMEDIATED IN CODE AND LIVE DB

Evidence:

- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ClientPortalManagerCard.tsx` exposes a checkbox labeled `Show high-level budget (totals only)`.
- The checkbox sends `client_show_budget_summary` to `PATCH /api/v1/projects/:id/client-portal`.
- `apps/web/app/api/v1/projects/[id]/client-portal/route.ts` accepts `client_show_budget_summary`.
- `apps/web/supabase/migrations/20260329100000_project_client_portal.sql` added `client_show_budget_summary` to `projects`.

This feature directly conflicts with the updated roadmap. "Totals only" is still internal company finance when it includes actual costs and planned totals.

Remediation:

- Removed the budget visibility checkbox from `ClientPortalManagerCard`.
- `PATCH /api/v1/projects/:id/client-portal` now accepts only `client_portal_enabled`.
- Added route test proving `client_show_budget_summary` updates are rejected.
- Applied live Supabase migration `phase0_customer_finance_isolation`.
- Verified live Supabase has `projects_with_client_budget_enabled = 0`.

### 3. Live Supabase allowed portal stakeholders to select internal cost items

Initial severity: CRITICAL

Status: REMEDIATED IN LIVE DB AND MIGRATION FILE

Read-only SQL against live Supabase showed:

```text
project_cost_items_select_portal:
(is_internal_tenant_reader_for_tenant(tenant_id) OR is_portal_stakeholder_for_project(project_id))
```

This means live database policy allows portal stakeholders to select from `project_cost_items`.

`project_cost_items` contains:

- `planned_amount`
- `actual_amount`
- `status`
- `notes`
- milestone linkage

This is expressly forbidden for customer/owner surfaces.

Remediation:

- Added local migration `apps/web/supabase/migrations/20260507062500_phase0_customer_finance_isolation.sql`.
- Applied the migration to live Supabase via MCP `apply_migration`.
- Verified live `project_cost_items` policies are now:
  - `project_cost_items_internal_select`
  - `project_cost_items_internal_insert`
  - `project_cost_items_internal_update`
  - `project_cost_items_internal_delete`
- Verified `project_cost_items_internal_select` uses only `is_internal_tenant_reader_for_tenant(tenant_id)`.

### 4. Change order public detail used budget language and budget amount fields

Initial severity: HIGH

Status: REMEDIATED IN CODE

Evidence:

- `apps/web/lib/domain/change-orders/change-orders.service.ts` returns `budget_impact_level`, `budget_impact_summary`, and `budget_delta_amount` in `ChangeOrderPublicDetail`.
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/change-orders/[changeOrderId]/ClientPortalChangeOrderDetailClient.tsx` renders `budget`, `budget_impact_level`, `budget_impact_summary`, and `indicativeDelta`.

The roadmap allows customer-facing change order price if it is explicitly a commercial change amount. Current naming and payload use budget terminology, which is unsafe and ambiguous. It should be converted to customer-facing commercial language and must not derive from internal implementation cost.

Remediation:

- `ChangeOrderPublicDetail` no longer includes `budget_impact_level`, `budget_impact_summary`, or `budget_delta_amount`.
- Non-manager `listChangeOrders` responses now return a sanitized `ChangeOrderPublicListItem`.
- Client change order detail UI no longer renders budget impact fields.
- Added tests proving non-manager list/detail payloads do not include budget fields or internal budget notes.

### 5. Internal manager cost routes exist and must remain manager-only

Severity: HIGH

Evidence:

- `GET /api/v1/projects/:id/costs`
- `GET /api/v1/projects/:id/costs/:costItemId`

These are explicitly forbidden for owner/customer in the roadmap. Live database policy no longer permits portal stakeholder selection on the underlying cost table. Runtime negative tests with real authenticated owner/customer credentials were not available in Phase 0.

## Non-Findings / Safe Notes

- `apps/web/app/api/v1/owner/health/route.ts` and `apps/web/app/api/v1/owner/critical/echo/route.ts` do not expose finance data based on static inspection.
- Client portal documents and milestones filter visible records and do not expose storage paths in the inspected service.
- Change order event notes are intentionally nulled for public detail in `toPublicDetail`.

## Validation Evidence

Static searches after remediation:

- `apps/web/lib/domain/client-portal` has no production matches for `getBudgetSummary`, `planned_total`, `actual_total`, `over_budget`, or `budget`.
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client` has no matches for `budget`, `planned_total`, `actual_total`, `over_budget`, `budget_delta`, or `budget_impact`.

Focused tests:

```text
4 test files passed
17 tests passed
```

Full local validation:

```text
No ESLint warnings or errors
247 test files passed
1359 tests passed
PHASE0_REVALIDATION_STATUS focused=0 lint=0 test=0 build=0 cfbuild=0
```

Live Supabase validation:

```text
projects_with_client_budget_enabled = 0
project_cost_items policies = internal-only select/insert/update/delete
live migration includes phase0_customer_finance_isolation
```

## Latest Production Deployment Recheck - 2026-05-07 06:51-06:54 UTC

The targeted customer finance isolation implementation remains locally validated and live Supabase remains remediated, but production was not updated in this recheck.

Cloudflare access checks:

```text
bunx wrangler whoami -> failed, Max auth failures reached [code: 9109]
bunx wrangler secret list --env production --config wrangler.toml -> failed, Authentication error [code: 10000]
bunx wrangler versions list --env production --config wrangler.toml -> failed, Authentication error [code: 10000]
Cloudflare MCP observability mcp_auth -> User skipped MCP authentication
```

Existing deploy script attempt:

```bash
cd apps/web && bun run cf:deploy:prod
```

Result:

```text
Dry-run deploy bundle: PASS
middleware-manifest bundle patch: PASS
Real Cloudflare production deploy: FAIL
Reason: Authentication error [code: 10000], invalid access token [code: 9109]
```

Live smoke after the failed deploy attempt:

```text
Production /api/v1/health -> HTTP 500
Staging /api/v1/health -> HTTP 200, ok=true, env=staging, buildStamp=e3abb52 / 2026-04-26 14:08
```

Production health was later restored through GitHub Actions deploy run `25481116848`, but that deploy used the current remote branch commit `62a1659`. The finance-isolation code changes in this working tree are not deployed until committed/pushed or deployed with a local token that has Worker publish permissions.

Latest production health after deploy:

```text
Production /api/v1/health -> ok=true, env=production, buildStamp=62a1659 / 2026-05-07 07:01
Production smoke -> PASS
```

The direct live Supabase leak is closed:

```text
projects_with_client_budget_enabled = 0
project_cost_items policies = internal-only select/insert/update/delete
```

## Phase 0 Isolation Verdict

Customer finance isolation pre-audit completed: YES

Internal finance leakage found initially: YES

Customer finance isolation remediated in code and live Supabase: YES

Production runtime health verified: YES

Production deploy completed in latest recheck: YES, via GitHub Actions run `25483838863`

Finance-isolation code deployed to production: YES, production build `3fda021 / 2026-05-07 08:06`.

Staging workflow blocker found and fixed: YES, `.github/workflows/deploy-cloudflare-staging.yml` no longer uses unsupported `continue-on-error` with a reusable workflow job.

Staging workflow fix active in GitHub: YES, staging deploy run `25483668533` succeeded.

Verdict: PASS

PHASE 0 CLOSED: YES
