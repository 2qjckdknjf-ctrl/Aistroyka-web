-- Task-scoped Worker ↔ Manager chat (text / voice / image / video).
-- Soft-delete via deleted_at. Media attachments reference finalized upload_sessions.

create table if not exists public.task_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.worker_tasks(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete restrict,
  kind text not null
    check (kind in ('text', 'voice', 'image', 'video')),
  body text,
  upload_session_id uuid references public.upload_sessions(id) on delete set null,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  client_id text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint task_messages_text_body_check check (
    kind <> 'text' or (body is not null and length(trim(body)) > 0)
  ),
  constraint task_messages_media_session_check check (
    kind = 'text' or upload_session_id is not null
  )
);

create index if not exists idx_task_messages_task_created
  on public.task_messages (task_id, created_at, id);

create index if not exists idx_task_messages_tenant_created
  on public.task_messages (tenant_id, created_at desc);

create unique index if not exists idx_task_messages_client_id
  on public.task_messages (tenant_id, task_id, sender_user_id, client_id)
  where client_id is not null and deleted_at is null;

comment on table public.task_messages is
  'Task-scoped chat between assigned workers and internal tenant members (managers).';

alter table public.task_messages enable row level security;

-- Assigned worker OR internal tenant reader may select non-deleted messages.
create policy task_messages_select on public.task_messages
  for select using (
    deleted_at is null
    and (
      public.is_internal_tenant_reader_for_tenant(tenant_id)
      or exists (
        select 1
        from public.worker_tasks wt
        where wt.id = task_messages.task_id
          and wt.tenant_id = task_messages.tenant_id
          and (
            wt.assigned_to = (select auth.uid())
            or exists (
              select 1
              from public.task_assignments ta
              where ta.task_id = wt.id
                and ta.tenant_id = wt.tenant_id
                and ta.user_id = (select auth.uid())
            )
          )
      )
    )
  );

-- Insert: same cohort; sender must be auth.uid().
create policy task_messages_insert on public.task_messages
  for insert with check (
    sender_user_id = (select auth.uid())
    and (
      public.is_internal_tenant_reader_for_tenant(tenant_id)
      or exists (
        select 1
        from public.worker_tasks wt
        where wt.id = task_messages.task_id
          and wt.tenant_id = task_messages.tenant_id
          and (
            wt.assigned_to = (select auth.uid())
            or exists (
              select 1
              from public.task_assignments ta
              where ta.task_id = wt.id
                and ta.tenant_id = wt.tenant_id
                and ta.user_id = (select auth.uid())
            )
          )
      )
    )
  );

-- Soft-delete update: sender or internal manager-capable roles (owner/admin/member).
create policy task_messages_update on public.task_messages
  for update using (
    sender_user_id = (select auth.uid())
    or exists (
      select 1
      from public.tenant_members tm
      where tm.tenant_id = task_messages.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'member')
    )
    or exists (
      select 1
      from public.tenants t
      where t.id = task_messages.tenant_id
        and t.user_id = (select auth.uid())
    )
  )
  with check (
    sender_user_id = (select auth.uid())
    or exists (
      select 1
      from public.tenant_members tm
      where tm.tenant_id = task_messages.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'member')
    )
    or exists (
      select 1
      from public.tenants t
      where t.id = task_messages.tenant_id
        and t.user_id = (select auth.uid())
    )
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'task_messages'
    ) then
      alter publication supabase_realtime add table public.task_messages;
    end if;
  end if;
end $$;
