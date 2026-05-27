-- Reduce external RPC surface: this SECURITY DEFINER function should be server-only.
-- Keep service_role execute for backend flows; remove direct authenticated access.

revoke execute on function public.create_analysis_job(uuid, uuid, text) from authenticated;
grant execute on function public.create_analysis_job(uuid, uuid, text) to service_role;
