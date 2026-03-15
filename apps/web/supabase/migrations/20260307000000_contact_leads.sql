-- Contact/demo form leads. Public submissions; insert via service role only.
-- API route uses service role to persist. RLS enabled with no policies: only service role (bypass) can access.

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_leads_created_at on public.contact_leads(created_at desc);
create index if not exists idx_contact_leads_email on public.contact_leads(email);

alter table public.contact_leads enable row level security;
