-- Phase 2C lite (corrective): atomic rate-limit + idempotency claim ownership.
-- NOT applied in this pass — create/contract-test only; operators apply separately.
-- Legacy checkAndIncrement (racy SELECT/UPDATE) remains for non-strict callers.

-- ---------------------------------------------------------------------------
-- 1) Single-key atomic increment (kept for narrow callers / debugging)
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_try_increment (
  p_key text,
  p_window_start timestamptz,
  p_limit int
) returns table (
  allowed boolean,
  current_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'p_key is required';
  end if;
  if p_window_start is null then
    raise exception 'p_window_start is required';
  end if;
  if p_limit is null or p_limit < 1 then
    raise exception 'p_limit must be >= 1';
  end if;

  insert into public.rate_limit_slots as s (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start) do update
    set count = s.count + 1
    where s.count < p_limit
  returning s.count into v_count;

  if found then
    return query select true, v_count;
    return;
  end if;

  select s.count into v_count
  from public.rate_limit_slots s
  where s.key = p_key
    and s.window_start = p_window_start;

  return query select false, coalesce(v_count, p_limit);
end;
$$;

revoke all on function public.rate_limit_try_increment (text, timestamptz, int) from public;
revoke all on function public.rate_limit_try_increment (text, timestamptz, int) from anon;
revoke all on function public.rate_limit_try_increment (text, timestamptz, int) from authenticated;
grant execute on function public.rate_limit_try_increment (text, timestamptz, int) to service_role;

-- ---------------------------------------------------------------------------
-- 2) Multi-bucket atomic all-or-nothing decision (strict help path)
-- p_buckets: jsonb array of { "key": text, "limit": int, "dimension": text }
-- Locks rows in lexicographic key order (deadlock-safe). Increments none unless
-- every bucket can accept one more request. Entire function = one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_try_increment_multi (
  p_window_start timestamptz,
  p_buckets jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket jsonb;
  v_key text;
  v_limit int;
  v_dimension text;
  v_count int;
  v_sorted jsonb;
  v_results jsonb := '[]'::jsonb;
  v_idx int := 0;
  v_len int;
begin
  if p_window_start is null then
    raise exception 'p_window_start is required';
  end if;
  if p_buckets is null or jsonb_typeof(p_buckets) <> 'array' or jsonb_array_length(p_buckets) < 1 then
    raise exception 'p_buckets must be a non-empty jsonb array';
  end if;

  -- Deterministic lock order by key (lexicographic).
  select coalesce(jsonb_agg(elem order by elem ->> 'key'), '[]'::jsonb)
  into v_sorted
  from jsonb_array_elements(p_buckets) as elem;

  v_len := jsonb_array_length(v_sorted);

  -- Phase 1: lock + check (no increments yet).
  for v_idx in 0 .. (v_len - 1) loop
    v_bucket := v_sorted -> v_idx;
    v_key := v_bucket ->> 'key';
    v_limit := (v_bucket ->> 'limit')::int;
    v_dimension := coalesce(v_bucket ->> 'dimension', 'unknown');

    if v_key is null or length(trim(v_key)) = 0 then
      raise exception 'bucket.key is required';
    end if;
    if v_limit is null or v_limit < 1 then
      raise exception 'bucket.limit must be >= 1';
    end if;

    insert into public.rate_limit_slots (key, window_start, count)
    values (v_key, p_window_start, 0)
    on conflict (key, window_start) do nothing;

    select s.count into v_count
    from public.rate_limit_slots s
    where s.key = v_key
      and s.window_start = p_window_start
    for update;

    if v_count is null then
      raise exception 'rate_limit_slots row missing after insert for %', v_key;
    end if;

    if v_count >= v_limit then
      -- No increments performed in this transaction → all-or-nothing.
      return jsonb_build_object(
        'allowed', false,
        'limited_dimension', v_dimension,
        'limited_key', v_key,
        'current_count', v_count,
        'limit', v_limit,
        'buckets', v_results
      );
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'key', v_key,
        'dimension', v_dimension,
        'limit', v_limit,
        'current_count', v_count,
        'next_count', v_count + 1
      )
    );
  end loop;

  -- Phase 2: all buckets clear → increment every locked row.
  for v_idx in 0 .. (v_len - 1) loop
    v_bucket := v_sorted -> v_idx;
    v_key := v_bucket ->> 'key';

    update public.rate_limit_slots s
    set count = s.count + 1
    where s.key = v_key
      and s.window_start = p_window_start
    returning s.count into v_count;

    v_results := jsonb_set(
      v_results,
      array[v_idx::text, 'current_count'],
      to_jsonb(v_count),
      true
    );
  end loop;

  return jsonb_build_object(
    'allowed', true,
    'limited_dimension', null,
    'limited_key', null,
    'current_count', null,
    'limit', null,
    'buckets', v_results
  );
end;
$$;

revoke all on function public.rate_limit_try_increment_multi (timestamptz, jsonb) from public;
revoke all on function public.rate_limit_try_increment_multi (timestamptz, jsonb) from anon;
revoke all on function public.rate_limit_try_increment_multi (timestamptz, jsonb) from authenticated;
grant execute on function public.rate_limit_try_increment_multi (timestamptz, jsonb) to service_role;

comment on function public.rate_limit_try_increment_multi (timestamptz, jsonb) is
  'Atomic multi-dimension rate limit: lock keys in sorted order, admit only if all buckets have room, else charge none.';

-- ---------------------------------------------------------------------------
-- 3) Idempotency claim ownership token (strict reclaim / finalize / release)
-- ---------------------------------------------------------------------------
alter table public.idempotency_keys
  add column if not exists claim_token text;

comment on column public.idempotency_keys.claim_token is
  'Opaque per-claim ownership token. Strict finalize/release require matching token so expired reclaim cannot be overwritten by a late prior handler.';
