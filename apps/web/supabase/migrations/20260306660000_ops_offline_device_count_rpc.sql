-- RPC for distinct offline device count (one count per device_id, not per token).
create or replace function public.get_offline_device_count(p_tenant_id uuid, p_since timestamptz)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(distinct device_id)::bigint
  from public.device_tokens
  where tenant_id = p_tenant_id
    and last_seen < p_since;
$$;

revoke all on function public.get_offline_device_count(uuid, timestamptz) from public;
grant execute on function public.get_offline_device_count(uuid, timestamptz) to service_role;
grant execute on function public.get_offline_device_count(uuid, timestamptz) to authenticated;
