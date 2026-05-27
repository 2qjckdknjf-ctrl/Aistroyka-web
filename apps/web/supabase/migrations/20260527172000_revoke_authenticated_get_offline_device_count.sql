-- get_offline_device_count is used by server-side ops diagnostics.
-- Keep service_role execute and remove direct authenticated RPC execute.

revoke execute on function public.get_offline_device_count(uuid, timestamptz) from authenticated;
grant execute on function public.get_offline_device_count(uuid, timestamptz) to service_role;
