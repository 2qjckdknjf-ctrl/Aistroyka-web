# Release Hardening — Security Wave 9A

Date: 2026-09-06
Scope: AI policy decision writer hardening only
Master tracker: #282

## Confirmed production finding

Read-only inspection of AISTROYKA production Supabase `vthfrxehrursfloevnlp` showed `public.ai_policy_decisions` has RLS enabled but an INSERT policy named `ai_policy_decisions_insert` with:

`with check (is_internal_tenant_reader_for_tenant(tenant_id))`

That means an authenticated internal tenant reader can create rows that are intended to represent AI governance decisions.

## Runtime caller audit

Repository search found production policy persistence through `runPolicy()` only. Current runtime callers pass a trusted admin/service-role Supabase client:

- Copilot `gateCopilotLlmRequest`
- core AI service
- estimate-cost service

Direct `recordPolicyDecision()` usage outside `runPolicy()` is test-only.

## Forward fix

Migration `20260906124000_harden_ai_policy_decision_writes.sql` removes the historical authenticated/internal-reader INSERT policy and intentionally creates no replacement authenticated INSERT policy.

`service_role` remains the trusted writer via RLS bypass.

Existing read policy is preserved; policy evaluation behavior is unchanged.

## Security boundary

This closes policy-decision forgery but does **not** by itself close AI chat role provenance. `ai_chat_messages` still needs a separate trusted-assistant writer change before authenticated inserts can be constrained to `role='user'`.

## Safety

- no production mutation
- no migration apply
- no deploy
- no feature scope
- stacked Draft PR only
- cumulative validation required
