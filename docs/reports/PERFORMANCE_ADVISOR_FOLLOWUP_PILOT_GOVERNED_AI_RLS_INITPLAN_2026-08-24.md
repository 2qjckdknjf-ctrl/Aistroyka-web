# Follow-up debt — pilot governed AI RLS initplan hardening (deferred)

**Status:** DEFERRED — not in PR #244 scope  
**Condition:** Execute only **after PR #244 merges to `main`** and pilot tables exist on staging/production per normal release flow.

## Title

Wrap `auth.role()` in service_role RLS policies for initplan performance on pilot governed AI tables.

## Affected policies

| Table | Policy |
|-------|--------|
| `public.ai_action_audit_records` | `ai_action_audit_service_role` |
| `public.report_completeness_evaluations` | `report_completeness_service_role` |

## Advisor findings

- Supabase performance advisor: `auth_rls_initplan` (WARN) on both policies.
- Introduced by PR #244 migrations `20260824122312` / hardened in `20260824150000`.

## Why deferred (not blocking PR #244)

1. **Performance-only** — no functional or security defect at pilot scale.
2. App writes use `getAdminClient()` (service role), which **bypasses RLS** (`BYPASSRLS`); these policies are defensive/PostgREST-path guards, not the primary write path.
3. Including a second remote migration in PR #244 would **re-open the migration gate** without owner approval for apply.
4. `main` does not yet contain pilot tables — a separate migration PR before product merge would be invalid.

## Proposed SQL (future migration file)

```sql
drop policy if exists ai_action_audit_service_role on public.ai_action_audit_records;
create policy ai_action_audit_service_role on public.ai_action_audit_records
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists report_completeness_service_role on public.report_completeness_evaluations;
create policy report_completeness_service_role on public.report_completeness_evaluations
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');
```

## Risks

- Low: policy drop/recreate only; no table/column changes.
- Must not run until pilot tables exist on target environment.

## Required local tests (when implemented)

- `pilot-governed-ai-migration.contract.test.ts` initplan wrap assertion
- Staging advisor re-check: `auth_rls_initplan` cleared for these two policies

## Owner approval (future)

New marker required before staging apply, e.g.:

`STAGING_MIGRATION_<VERSION>_APPLY=YES`

## Milestone

Post-merge PR #244 → separate small migration PR → owner-gated staging apply → advisor re-scan.
