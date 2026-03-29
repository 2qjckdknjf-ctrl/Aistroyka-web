-- Wave 4 Step 7 closure: portal-only external stakeholders (not generic tenant viewers).
-- Stakeholders get tenant_members.role = 'stakeholder' so app policy can deny internal workspace APIs.

alter table public.tenant_members drop constraint if exists tenant_members_role_check;
alter table public.tenant_members add constraint tenant_members_role_check
  check (role in ('owner', 'admin', 'member', 'viewer', 'stakeholder'));

comment on constraint tenant_members_role_check on public.tenant_members is
  'stakeholder = external client portal access only; must not receive internal workspace reader privileges.';
