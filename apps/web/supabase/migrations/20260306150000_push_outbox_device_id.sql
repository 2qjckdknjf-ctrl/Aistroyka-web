-- Phase 7.7: per-device push outbox for correct multi-device delivery and dedupe.
alter table public.push_outbox
  add column if not exists device_id text;

comment on column public.push_outbox.device_id is 'When set, push_send delivers only to this device; enables one row per device and (task_id, user_id, device_id, type) dedupe.';
