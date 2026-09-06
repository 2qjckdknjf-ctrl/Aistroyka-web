-- RELEASE HARDENING: preserve concrete Supabase Auth identity ids and allow
-- authenticated users to delete only their own mirrored identity rows.

alter table public.user_identities
  add column if not exists identity_id text;

create index if not exists idx_user_identities_identity_id
  on public.user_identities(identity_id)
  where identity_id is not null;

drop policy if exists user_identities_delete_own on public.user_identities;
create policy user_identities_delete_own
  on public.user_identities
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
