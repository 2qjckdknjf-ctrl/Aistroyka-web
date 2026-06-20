# Main DB / Contracts Inventory — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## Migration Directories Found
- `apps/web/supabase/migrations/`
- No tracked root `supabase/migrations/` files found.
- No tracked `packages/*/migrations/` files found.

## Migration Files In Current Branch
- Count: 150 tracked SQL migrations.
- Directory: `apps/web/supabase/migrations/`
- Earliest: `20260303000000_base_tenants_projects.sql`
- Latest:
  - `20260620140442_rbac_stage1_security_hardening.sql`
  - `20260620142136_stage2_1_accounts_foundation.sql`

Current main already includes major product-domain and security migration families:
- tenant/project base, RBAC, worker-lite/mobile sync, upload sessions, jobs, idempotency, metrics
- reports/review, manager notifications, project milestones/documents/costs/estimates
- stakeholder portal, change orders, handover, defects, aftercare, recurring ops
- AI usage/billing, AI chat stream, AI guide events, AI memory/eval/optimization legacy tables
- customer finance isolation and commercial/customer-facing estimate migrations
- Supabase hardening/RLS/index cleanup batches
- Stage 2 account/RBAC foundation migrations from 2026-06-20

## Contracts Packages Found
- `packages/contracts/`
  - `packages/contracts/src/api/v1/types.ts`
  - `packages/contracts/src/schemas/ai.schema.ts`
  - `packages/contracts/src/schemas/config.schema.ts`
  - `packages/contracts/src/schemas/health.schema.ts`
  - `packages/contracts/src/schemas/plan-fit.schema.ts`
  - `packages/contracts/src/schemas/projects.schema.ts`
  - `packages/contracts/src/schemas/subscription.schema.ts`
  - `packages/contracts/src/schemas/sync.schema.ts`
  - `packages/contracts/src/schemas/tenant.schema.ts`
  - `packages/contracts/src/schemas/worker.schema.ts`
- `packages/contracts-openapi/`
  - `packages/contracts-openapi/build-openapi.ts`
  - `packages/contracts-openapi/dist/openapi.json`
  - `packages/contracts-openapi/validate-openapi.mjs`

## API / Schema Files Found
- `apps/web/app/api/**/*.ts`: 362 tracked route/test files.
- `apps/web/lib/**/*.ts`: 866 tracked library/type/service/test files.
- Schema-oriented files include:
  - `apps/web/lib/platform/plan-fit/plan-fit-api.schema.ts`
  - `apps/web/lib/observability/event.schema.ts`
  - `packages/contracts/src/schemas/*.ts`
- Supabase client/server files include:
  - `apps/web/lib/supabase/admin.ts`
  - `apps/web/lib/supabase/client.ts`
  - `apps/web/lib/supabase/middleware.ts`
  - `apps/web/lib/supabase/rpc.ts`
  - `apps/web/lib/supabase/server.ts`

## Generated Files Found
- `packages/contracts-openapi/dist/openapi.json`
- No generated Supabase DB type file was identified by tracked filename search.

## Warnings
- This inventory is repository-only. It does not prove the live Supabase schema matches repository migrations.
- Do not apply or repair migrations from this phase.
- Before any future schema integration, compare with the active AISTROYKA Supabase project and migration history.
- Current local validation is blocked by Volta/node, so no contract build/regeneration should be attempted until the toolchain is fixed.
