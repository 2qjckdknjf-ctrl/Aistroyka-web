-- Wave 4 Step 7: External stakeholder identity — project-scoped invites (not SSO / not org IAM).

create table if not exists public.project_stakeholders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  stakeholder_role text not null check (stakeholder_role in ('client_viewer', 'client_decision_maker')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'invited' check (status in ('invited', 'active', 'revoked')),
  user_id uuid references auth.users(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_project_stakeholders_token on public.project_stakeholders(token);

create unique index if not exists idx_project_stakeholders_project_email_active
  on public.project_stakeholders(project_id, lower(trim(email)))
  where status in ('invited', 'active');

create index if not exists idx_project_stakeholders_project on public.project_stakeholders(project_id);
create index if not exists idx_project_stakeholders_tenant on public.project_stakeholders(tenant_id);
create index if not exists idx_project_stakeholders_user on public.project_stakeholders(user_id) where user_id is not null;

alter table public.project_stakeholders enable row level security;

create policy project_stakeholders_tenant_member on public.project_stakeholders for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
  or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
);

create or replace function public.set_project_stakeholders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists project_stakeholders_updated_at on public.project_stakeholders;
create trigger project_stakeholders_updated_at before update on public.project_stakeholders
  for each row execute function public.set_project_stakeholders_updated_at();

comment on table public.project_stakeholders is 'External stakeholder access to client portal/requests; invite by email + token. Accept ensures tenant_members(stakeholder) for portal-scoped tenancy (see Wave 4 Step 7 isolation).';
