create table if not exists public.rate_limit_slots (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0 check (count >= 0),
  primary key (key, window_start)
);
create index if not exists idx_rate_limit_slots_window on public.rate_limit_slots(window_start);
alter table public.rate_limit_slots enable row level security;
