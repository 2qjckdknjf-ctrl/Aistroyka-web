-- October 13 live advisor/schema audit: these helpers inherited PUBLIC EXECUTE.
-- Preserve function bodies, trigger bindings, RLS and all applied source SQL.
-- Public Data API callers must not inspect project/tenant existence or call guards.
begin;

revoke execute on function
  public.can_manage_project_membership(uuid, uuid),
  public.can_read_project_membership(uuid, uuid),
  public.is_internal_tenant_writer_for_tenant(uuid),
  public.is_tenant_owner_or_admin(uuid),
  public.project_belongs_to_tenant(uuid, uuid)
from public, anon;

-- RLS expressions and existing caller-scoped APIs use these helpers.
grant execute on function
  public.can_manage_project_membership(uuid, uuid),
  public.can_read_project_membership(uuid, uuid),
  public.is_internal_tenant_writer_for_tenant(uuid),
  public.is_tenant_owner_or_admin(uuid),
  public.project_belongs_to_tenant(uuid, uuid)
to authenticated, service_role;

-- Trigger invocation is retained; these functions are not public RPC endpoints.
revoke execute on function
  public.enforce_customer_estimate_decision_via_service(),
  public.enforce_field_daily_log_identity_immutable(),
  public.enforce_jobs_authenticated_update_guard(),
  public.enforce_project_members_privilege_change(),
  public.enforce_tenant_members_role_change(),
  public.jobs_protect_payload_project_tenant(),
  public.media_protect_file_url()
from public, anon, authenticated;

grant execute on function
  public.enforce_customer_estimate_decision_via_service(),
  public.enforce_field_daily_log_identity_immutable(),
  public.enforce_jobs_authenticated_update_guard(),
  public.enforce_project_members_privilege_change(),
  public.enforce_tenant_members_role_change(),
  public.jobs_protect_payload_project_tenant(),
  public.media_protect_file_url()
to service_role;

commit;
