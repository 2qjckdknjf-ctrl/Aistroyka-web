-- Atomic AI usage accounting for governed provider calls.
-- Code-only migration in this PR: do not apply without the normal owner migration gate.

create or replace function public.record_ai_usage_and_spend_atomic(
  p_tenant_id uuid,
  p_user_id uuid,
  p_trace_id text,
  p_provider text,
  p_model text,
  p_tokens_input integer,
  p_tokens_output integer,
  p_tokens_total integer,
  p_cost_usd numeric,
  p_status text,
  p_error_type text default null,
  p_duration_ms integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start date := date_trunc('month', current_date)::date;
  v_period_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
begin
  if p_tenant_id is null then
    raise exception 'tenant_id_required';
  end if;

  -- Concurrent first requests are safe: exactly one creates the row and all callers
  -- continue against the same tenant state inside their transaction.
  insert into public.tenant_billing_state (
    tenant_id,
    period_start,
    period_end,
    budget_usd,
    spent_usd
  ) values (
    p_tenant_id,
    v_period_start,
    v_period_end,
    0,
    0
  )
  on conflict (tenant_id) do nothing;

  insert into public.ai_usage (
    tenant_id,
    user_id,
    trace_id,
    provider,
    model,
    tokens_input,
    tokens_output,
    tokens_total,
    cost_usd,
    status,
    error_type,
    duration_ms
  ) values (
    p_tenant_id,
    p_user_id,
    p_trace_id,
    p_provider,
    p_model,
    p_tokens_input,
    p_tokens_output,
    p_tokens_total,
    p_cost_usd,
    p_status,
    p_error_type,
    p_duration_ms
  );

  -- This update is in the same database transaction as the usage insert. Any failure
  -- rolls back both writes, and concurrent calls increment from the locked row value.
  update public.tenant_billing_state
  set spent_usd = spent_usd + greatest(coalesce(p_cost_usd, 0), 0)
  where tenant_id = p_tenant_id;

  if not found then
    raise exception 'tenant_billing_state_update_failed';
  end if;
end;
$$;

revoke all on function public.record_ai_usage_and_spend_atomic(
  uuid, uuid, text, text, text, integer, integer, integer, numeric, text, text, integer
) from public, anon, authenticated;

grant execute on function public.record_ai_usage_and_spend_atomic(
  uuid, uuid, text, text, text, integer, integer, integer, numeric, text, text, integer
) to service_role;

comment on function public.record_ai_usage_and_spend_atomic(
  uuid, uuid, text, text, text, integer, integer, integer, numeric, text, text, integer
) is 'Atomically persists one AI usage row and increments tenant spent_usd; service_role only.';
