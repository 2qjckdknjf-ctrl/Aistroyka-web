-- Release 1 hardening: trigger_analysis must be service-role only.
-- Removes accidental execute grants for anon/authenticated/public.

revoke execute on function public.trigger_analysis(uuid) from authenticated;
revoke execute on function public.trigger_analysis(uuid) from anon;
revoke execute on function public.trigger_analysis(uuid) from public;

grant execute on function public.trigger_analysis(uuid) to service_role;
