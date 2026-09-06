-- RELEASE HARDENING WAVE 7
-- Remove direct REST/RPC execution rights from trigger-only SECURITY DEFINER functions.
-- Existing triggers are already created and owned by postgres; this does not alter trigger bodies,
-- trigger bindings, table grants, or RLS policy helpers.

-- These functions return trigger and are intended to execute only from their bound triggers.
-- PUBLIC receives EXECUTE on functions by default in PostgreSQL, and production also has explicit
-- anon/authenticated grants. Remove those direct-call grants while retaining service-role access.

revoke all privileges on function public.jobs_protect_payload_project_tenant()
  from public, anon, authenticated;
grant execute on function public.jobs_protect_payload_project_tenant()
  to service_role;

revoke all privileges on function public.media_protect_file_url()
  from public, anon, authenticated;
grant execute on function public.media_protect_file_url()
  to service_role;

-- Intentionally do NOT revoke authenticated EXECUTE from
-- can_manage_project_membership(...) / can_read_project_membership(...):
-- existing RLS policies call those boolean helpers as the authenticated role.
