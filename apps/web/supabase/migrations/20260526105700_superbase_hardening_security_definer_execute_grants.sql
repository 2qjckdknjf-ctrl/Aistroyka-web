-- Tighten execute grants for SECURITY DEFINER functions surfaced by advisor.

-- Queue internals: service-role only
revoke execute on function public.claim_jobs(text, integer, uuid) from anon, authenticated;
grant execute on function public.claim_jobs(text, integer, uuid) to service_role;

revoke execute on function public.try_acquire_job_slot(uuid) from anon, authenticated;
grant execute on function public.try_acquire_job_slot(uuid) to service_role;

revoke execute on function public.release_job_slot(uuid) from anon, authenticated;
grant execute on function public.release_job_slot(uuid) to service_role;

-- Analysis job RPC: signed-in users + service-role, but never anon
revoke execute on function public.create_analysis_job(uuid, uuid, text) from anon;
grant execute on function public.create_analysis_job(uuid, uuid, text) to authenticated, service_role;

-- Tenant-helper RPC: authenticated only
revoke execute on function public.current_user_tenant_ids() from anon;
grant execute on function public.current_user_tenant_ids() to authenticated;

-- Portal/helper checks: block anon direct execution.
revoke execute on function public.get_offline_device_count(uuid, timestamptz) from anon;
grant execute on function public.get_offline_device_count(uuid, timestamptz) to authenticated, service_role;

revoke execute on function public.is_internal_tenant_reader_for_tenant(uuid) from anon;
grant execute on function public.is_internal_tenant_reader_for_tenant(uuid) to authenticated, service_role;

revoke execute on function public.is_portal_stakeholder_for_document(uuid) from anon;
grant execute on function public.is_portal_stakeholder_for_document(uuid) to authenticated, service_role;

revoke execute on function public.is_portal_stakeholder_for_project(uuid) from anon;
grant execute on function public.is_portal_stakeholder_for_project(uuid) to authenticated, service_role;

revoke execute on function public.stakeholder_discussion_portal_set_status(uuid, uuid, text) from anon;
grant execute on function public.stakeholder_discussion_portal_set_status(uuid, uuid, text) to authenticated, service_role;
