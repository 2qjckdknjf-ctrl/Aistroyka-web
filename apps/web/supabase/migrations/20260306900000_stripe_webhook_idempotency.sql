-- Stripe webhook idempotency: record processed event ids to avoid double-processing on retries.
-- Only service_role can insert/select (used by webhook route with getAdminClient).

create table if not exists public.processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

comment on table public.processed_stripe_events is 'Stripe webhook event ids already processed; idempotency for retries.';

alter table public.processed_stripe_events enable row level security;

-- Only service role (backend) can access this table.
create policy processed_stripe_events_service_role on public.processed_stripe_events
  for all using (auth.role() = 'service_role');
