-- Defense-in-depth: prevent authenticated tenants from mutating media.file_url after insert.
-- INSERT still sets file_url via trusted upload routes; application-level path guards remain mandatory.
-- service_role may still update file_url if needed for ops.
--
-- ROLLBACK:
--   drop trigger if exists media_file_url_immutable_trg on public.media;
--   drop function if exists public.media_protect_file_url();
--
-- DO NOT apply to production without owner approval.

create or replace function public.media_protect_file_url()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.file_url is distinct from old.file_url
     and coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'media.file_url is immutable for non-service roles'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists media_file_url_immutable_trg on public.media;

create trigger media_file_url_immutable_trg
  before update on public.media
  for each row
  execute function public.media_protect_file_url();

comment on function public.media_protect_file_url() is
  'Blocks client/authenticated UPDATEs that change media.file_url; service_role exempt.';
