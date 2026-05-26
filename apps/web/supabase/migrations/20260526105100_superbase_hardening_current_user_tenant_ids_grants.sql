revoke execute on function public.current_user_tenant_ids() from anon;
grant execute on function public.current_user_tenant_ids() to authenticated;
