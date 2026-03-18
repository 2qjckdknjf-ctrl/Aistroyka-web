-- Phase 7.7: per-device push outbox (runs before 06610000 creates push_outbox on fresh chains).
-- Only alter when table already exists (legacy DBs); new chains get device_id from 06610000.

do $$
begin
  if to_regclass('public.push_outbox') is not null then
    alter table public.push_outbox
      add column if not exists device_id text;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'push_outbox' and column_name = 'device_id'
  ) then
    execute 'comment on column public.push_outbox.device_id is ''When set, push_send delivers only to this device; enables one row per device and (task_id, user_id, device_id, type) dedupe.''';
  end if;
end $$;
