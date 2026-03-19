-- Lead capture foundation: status, source, notes for contact_leads.
-- Minimal workflow: new -> reviewed -> contacted | archived.

alter table public.contact_leads
  add column if not exists source text not null default 'contact_form',
  add column if not exists status text not null default 'new',
  add column if not exists notes text;

-- Constrain status to allowed values
alter table public.contact_leads
  add constraint contact_leads_status_check
  check (status in ('new', 'reviewed', 'contacted', 'archived'));

create index if not exists idx_contact_leads_status on public.contact_leads(status);
create index if not exists idx_contact_leads_source on public.contact_leads(source);

comment on column public.contact_leads.source is 'Origin: contact_form, etc.';
comment on column public.contact_leads.status is 'Workflow: new | reviewed | contacted | archived';
comment on column public.contact_leads.notes is 'Internal notes (manager/admin only)';
