# Release Hardening — Security Wave 7

Date: 2026-09-06
Scope: trigger-only `SECURITY DEFINER` direct EXECUTE grants
Release issue: #282

## Live production evidence

Read-only Supabase audit of production project `vthfrxehrursfloevnlp` found security-advisor warnings for four public `SECURITY DEFINER` functions.

Two project-membership helpers are intentionally callable by `authenticated` because existing RLS policies invoke them and their result is bound to `auth.uid()`:

- `public.can_manage_project_membership(uuid, uuid)`
- `public.can_read_project_membership(uuid, uuid)`

Those authenticated grants are not changed in this wave.

Two functions are trigger-only and have no legitimate direct client RPC use:

- `public.jobs_protect_payload_project_tenant()` — bound to `jobs_payload_project_tenant_trg` on `public.jobs`
- `public.media_protect_file_url()` — bound to `media_file_url_immutable_trg` on `public.media`

Production ACL evidence showed PUBLIC/default plus explicit `anon`, `authenticated`, and `service_role` EXECUTE on both trigger functions. Both functions and both triggers are owned/created under the database owner path; the triggers are enabled.

## Change

Migration `20260906123000_harden_trigger_security_definer_execute_grants.sql`:

- revokes direct EXECUTE from `PUBLIC`, `anon`, and `authenticated` for both trigger-only functions;
- retains EXECUTE for `service_role`;
- does not change function bodies;
- does not recreate or change triggers;
- does not alter RLS/table grants;
- does not revoke authenticated execution from the two project-membership RLS helpers.

## Regression contract

`apps/web/lib/tenant/trigger-security-definer-grants.hardening.test.ts` asserts:

1. both trigger-only functions lose public/anon/authenticated direct execution;
2. service-role execution remains;
3. authenticated project-membership helper execution is not accidentally revoked.

## Release status

Draft-only. No migration has been applied to staging or production.

AISTROYKA currently has no Supabase development branch, so migration execution still requires a dedicated staging/branch validation gate before production rollout.
