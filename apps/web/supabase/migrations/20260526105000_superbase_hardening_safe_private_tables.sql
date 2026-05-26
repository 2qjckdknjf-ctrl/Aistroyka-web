-- Safe hardening for service-role/private operational tables

-- 1) Add missing FK indexes
create index if not exists idx_support_ticket_messages_author_user_id
  on public.support_ticket_messages(author_user_id)
  where author_user_id is not null;

create index if not exists idx_tenant_invitations_created_by
  on public.tenant_invitations(created_by);

create index if not exists idx_telegram_link_tokens_tenant_id
  on public.telegram_link_tokens(tenant_id);

create index if not exists idx_telegram_link_tokens_user_id
  on public.telegram_link_tokens(user_id);

create index if not exists idx_user_telegram_links_user_id
  on public.user_telegram_links(user_id);

-- 2) Explicit deny-all RLS policies for service-role only tables.
-- Service role bypasses RLS; authenticated/anon are denied explicitly.
drop policy if exists telegram_link_tokens_deny_all on public.telegram_link_tokens;
create policy telegram_link_tokens_deny_all
  on public.telegram_link_tokens
  for all
  using (false)
  with check (false);

drop policy if exists user_telegram_links_deny_all on public.user_telegram_links;
create policy user_telegram_links_deny_all
  on public.user_telegram_links
  for all
  using (false)
  with check (false);

drop policy if exists telegram_delivery_audit_deny_all on public.telegram_delivery_audit;
create policy telegram_delivery_audit_deny_all
  on public.telegram_delivery_audit
  for all
  using (false)
  with check (false);
