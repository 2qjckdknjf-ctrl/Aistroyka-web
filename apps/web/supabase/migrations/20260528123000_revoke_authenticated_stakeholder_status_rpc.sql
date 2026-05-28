-- Portal discussion status transition is now handled in server code after policy checks.
-- Keep this SECURITY DEFINER RPC callable only by service_role.

revoke execute on function public.stakeholder_discussion_portal_set_status(uuid, uuid, text) from authenticated;
grant execute on function public.stakeholder_discussion_portal_set_status(uuid, uuid, text) to service_role;
