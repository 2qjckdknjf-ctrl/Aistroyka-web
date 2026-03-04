-- Enable Supabase Realtime for manager dashboard / worker status (Phase 4.2).
-- Clients subscribe via postgres_changes with filter tenant_id=eq.<id> or project_id=eq.<id> where applicable.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'job_events') then
      alter publication supabase_realtime add table public.job_events;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'worker_reports') then
      alter publication supabase_realtime add table public.worker_reports;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'upload_sessions') then
      alter publication supabase_realtime add table public.upload_sessions;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'worker_tasks') then
      alter publication supabase_realtime add table public.worker_tasks;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'task_assignments') then
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'task_assignments') then
        alter publication supabase_realtime add table public.task_assignments;
      end if;
    end if;
  end if;
end $$;
