-- RELEASE HARDENING WAVE 9A
-- AI governance policy decisions are server audit evidence, not client-writable state.
-- All known runtime callers persist through a service-role/admin Supabase client.

-- Remove the historical authenticated/internal-reader INSERT path.
drop policy if exists ai_policy_decisions_insert on public.ai_policy_decisions;
drop policy if exists ai_policy_decisions_write on public.ai_policy_decisions;
drop policy if exists ai_policy_decisions_internal_insert on public.ai_policy_decisions;

-- Intentionally no authenticated INSERT policy.
-- service_role bypasses RLS and remains the trusted writer used by runPolicy().

-- Preserve existing tenant-scoped SELECT behavior for authorized internal readers.
-- This migration does not broaden read access and does not alter policy evaluation logic.

comment on table public.ai_policy_decisions is
  'AI governance audit decisions. Inserts are trusted server/service-role only; authenticated clients may not forge policy evidence.';
