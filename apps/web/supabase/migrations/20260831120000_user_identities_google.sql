-- Allow Google as a linked identity provider alongside Apple and Telegram.

alter table public.user_identities
  drop constraint if exists user_identities_provider_check;

alter table public.user_identities
  add constraint user_identities_provider_check
  check (provider in ('apple', 'telegram', 'google'));
