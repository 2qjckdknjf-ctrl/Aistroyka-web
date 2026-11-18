# PR #277 P1 Forward-Fix Report — 2026-08-31

## Trigger

PR #277 was merged into `main` as merge commit `143930fdc1bccb6d0785c4412e7e19cd593dd50f` while three P1 review threads remained unresolved.

## Fix 1 — OAuth linked-provider persistence

### Problem
The OAuth callback used `user.app_metadata.provider`, which can remain the account's primary provider when an existing Apple/email user links Google. The callback could therefore persist the wrong provider row or miss Google entirely.

### Forward fix
- OAuth initiation now carries the expected provider into the callback URL.
- Callback resolves the concrete matching record from `user.identities`.
- Persistence uses the concrete identity's `identity_id` / `id` and provider subject (`identity_data.sub`) instead of `user_metadata.sub` or the account primary provider.
- A new `identity_id` column is added to `public.user_identities`.
- Link intent fails closed if the requested concrete provider identity is missing or persistence fails.

### Test coverage
`apps/web/app/api/auth/callback/route.test.ts` now covers the critical case: primary provider remains Apple while the newly linked Google identity is persisted with Google's real identity id and subject.

## Fix 2 — Auth/database unlink consistency

### Problem
The user-scoped delete from `public.user_identities` had no DELETE RLS policy. Supabase Auth identity removal could succeed while the application row remained, producing a ghost linked method.

### Forward fix
- New migration adds `user_identities_delete_own` (`user_id = auth.uid()`).
- `unlinkIdentityRow` now requires a confirmed deleted row, not merely the absence of a database error.
- Unlink order is now application-row delete first, then Supabase Auth unlink.
- If Supabase Auth unlink fails, the application row is restored as compensation.
- The last-method guard now counts email only when an actual Supabase `email` identity exists; an email address attached to an OAuth-only account is not treated as a password sign-in method.

### Test coverage
`apps/web/app/api/v1/auth/methods/route.test.ts` now covers:
- OAuth email not being counted as a password method;
- blocking deletion of the last real method;
- successful Google unlink;
- compensation when Supabase Auth unlink fails.

## Fix 3 — Worker correction evidence gate

### Problem
`ReportResubmitView.attachCorrectionThenSubmit()` caught `uploadEvidence` / `addMedia` errors but still fell through to `queueSubmitOperation()`. A report could be resubmitted without the correction evidence selected by the worker.

### Forward fix
- JPEG conversion failure stops the flow.
- `uploadEvidence` failure stops the flow.
- `addMedia` failure stops the flow.
- `queueSubmitOperation()` is reached only after the selected correction image has been successfully uploaded and attached, or when no new correction image was selected.
- Existing queued submit idempotency remains unchanged.

## Migration

New migration:

`apps/web/supabase/migrations/20260831194500_user_identities_hardening.sql`

It adds:
- nullable `identity_id`;
- partial index for `identity_id`;
- own-row DELETE RLS policy.

This is a forward migration; the already-merged migration is not rewritten.

## Remaining verification

Repository changes require CI/build confirmation and the normal migration/deploy gate before production. The iOS correction-flow source fix is compile-gated by the iOS simulator smoke; a dedicated injected-network unit test for upload/add-media failure remains a recommended follow-up if the current test architecture does not already provide an injectable WorkerAPI transport.
