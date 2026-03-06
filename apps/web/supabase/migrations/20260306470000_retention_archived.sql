alter table public.upload_sessions add column if not exists archived_at timestamptz;
