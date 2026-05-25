# ONBOARDING / INVITE / SUPPORT VALIDATION

Date: 2026-05-25  
Project: AISTROYKA

## Root cause

- Onboarding choices were local UI state only, not persisted.
- Invite flow and onboarding flow were not coordinated, so invite-driven users could accidentally create separate tenants.
- Support entry in user cabinet was missing a persistent ticket system and owner reply loop.

## Implemented validation scope

1. Anonymous `/dashboard` redirects to login with `next`.
2. Anonymous `/owner` remains isolated by owner gate.
3. Register/login redirect into dashboard onboarding gate (not forced `/subscribe`).
4. Onboarding persists persona/company and completion status.
5. Invite flow:
   - token preview with company/role
   - login/register preserves invite continuation
   - accept invite binds user to tenant membership
   - invite mismatch by email remains blocked
6. Team UX:
   - dashboard sidebar adds team entry for owner/admin
   - invite link visible/copyable in UI
7. Support UX:
   - user creates ticket
   - user sees ticket thread
   - owner can read ticket queue and send persistent replies
   - user can see owner replies

## Commands

- `bun run lint` -> PASS
- `bun run test` -> PASS (1471 tests)
- `bun run build` -> PASS
- `bun run cf:build` -> PASS

## Smoke case matrix (current)

1. anonymous `/dashboard` -> login with `next`  
   Status: IMPLEMENTED (middleware guard preserved)
2. anonymous `/owner` denied/no content leak  
   Status: IMPLEMENTED (owner middleware + layout guard preserved)
3. register normal owner -> onboarding -> owner dashboard  
   Status: IMPLEMENTED IN CODE; pending E2E runtime proof
4. tenant owner sees Team / Invitations  
   Status: IMPLEMENTED
5. tenant owner creates invite link  
   Status: IMPLEMENTED
6. invited user registers via invite -> joins correct tenant  
   Status: IMPLEMENTED IN CODE; pending E2E runtime proof
7. invited user does not create separate tenant  
   Status: IMPLEMENTED IN CODE (tenant auto-create removed)
8. platform owner login -> `/owner` works  
   Status: IMPLEMENTED
9. normal user -> `/owner` blocked  
   Status: IMPLEMENTED
10. support ticket round-trip (user create -> owner reply -> user sees)  
    Status: IMPLEMENTED IN CODE; pending E2E runtime proof
11. customer portal remains `/portal` and separate from `/owner`  
    Status: PRESERVED

## Changed files

- `apps/web/components/onboarding/OnboardingWizard.tsx`
- `apps/web/components/onboarding/OnboardingGate.tsx`
- `apps/web/app/api/v1/onboarding/status/route.ts`
- `apps/web/app/api/v1/onboarding/complete/route.ts`
- `apps/web/app/[locale]/invite/accept/page.tsx`
- `apps/web/app/api/v1/tenant/invite-preview/route.ts`
- `apps/web/app/api/v1/mobile-links/route.ts`
- `apps/web/components/DashboardShell.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/support/*`
- `apps/web/app/api/v1/support/*`
- `apps/web/app/api/v1/owner/support/*`
- `apps/web/lib/api/engine.ts`
- `apps/web/supabase/migrations/20260525210000_cabinet_architecture_recovery.sql`

## Remaining external steps

- Apply migration in Supabase.
- Run E2E smoke against a migrated environment for invite and support round-trip.
- Configure mobile link env vars for production stores (or keep "coming soon").

## Final verdict

NOT CLOSED

Reason:
- Manual/deployed smoke of invite and support round-trip remains pending.
