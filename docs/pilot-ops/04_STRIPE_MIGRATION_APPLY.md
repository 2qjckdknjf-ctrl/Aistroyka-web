# Phase 4 — Stripe Idempotency Migration

**Goal:** Prevent duplicate billing events by applying the Stripe webhook idempotency migration.

---

## Migration file

- **Path:** `apps/web/supabase/migrations/20260306900000_stripe_webhook_idempotency.sql`
- **Creates:** Table `public.processed_stripe_events` (event_id primary key, processed_at). RLS: only `service_role` can access. Used by the billing webhook route to record processed Stripe event IDs and avoid double-processing on retries.

---

## CLI method (Supabase CLI)

From repo root, with Supabase project linked:

```bash
cd /Users/alex/Projects/AISTROYKA
npx supabase db push
```

Or run only this migration:

```bash
cd apps/web
npx supabase migration up
```

(Exact command depends on your Supabase CLI setup; `supabase db push` applies pending migrations.)

---

## Dashboard method

1. Open **Supabase Dashboard** → **SQL Editor**.
2. Copy the contents of `apps/web/supabase/migrations/20260306900000_stripe_webhook_idempotency.sql`:

```sql
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
```

3. Run the script. **Expected:** Success; table `processed_stripe_events` exists.

---

## Verification query

In Supabase SQL Editor:

```sql
select count(*) from public.processed_stripe_events;
```

**Expected:** 0 (or any number if events were already processed). No error = table exists and is readable with service_role.

To confirm table exists:

```sql
select exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'processed_stripe_events'
);
```

**Expected:** `true`.
