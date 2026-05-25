# CABINET ARCHITECTURE RECOVERY REPORT

Date: 2026-05-25  
Project: AISTROYKA  
Scope: Public/Auth/Cabinet/Owner architecture recovery

## Root cause

- Registration/login flow diverged from cabinet model: `/register` only captured email/password and redirected to `/subscribe` when a session existed.
- Onboarding UI existed, but persona/company choices were not persisted and were not controlling tenant creation.
- Core helper `getOrCreateTenantForCurrentUser()` auto-created tenants in implicit code paths (`activation`, `team`, etc.), causing accidental tenant creation for invite-driven users.
- Legacy and canonical APIs coexisted with duplicated implementations (`/api/*` and `/api/v1/*`), leaving clients on legacy paths and increasing drift risk.
- Owner cabinet route `/[locale]/owner` was protected but mostly placeholder content.

## Stage A truth audit (routes/APIs)

### Route inventory

- `/[locale]/register` -> auth register UI
- `/[locale]/login` -> auth login UI
- `/[locale]/dashboard` -> user cabinet dashboard + onboarding gate
- `/[locale]/team` -> team/invitations management
- `/[locale]/invite/accept` -> invite acceptance landing
- `/[locale]/portal` -> customer/property-owner portal (preserved)
- `/[locale]/owner` -> platform owner cabinet (isolated)
- `/[locale]/admin` -> admin/operator dashboard surface (inside authenticated dashboard area)

### API inventory and canonicalization

- `/api/auth/login` + `/api/v1/auth/login` (canonical: `/api/v1/auth/login`; client switched)
- `/api/activation/status` + `/api/v1/activation/status` (legacy now redirects to v1)
- `/api/tenant/invite` + `/api/v1/tenant/invite` (legacy now redirects to v1)
- `/api/tenant/accept-invite` + `/api/v1/tenant/accept-invite` (legacy now redirects to v1)
- `/api/tenant/invitations` + `/api/v1/tenant/invitations` (legacy now redirects to v1)
- `/api/tenant/revoke` + `/api/v1/tenant/revoke` (legacy now redirects to v1)
- `/api/v1/portal/*` preserved as customer portal namespace (unchanged boundary)
- `/api/v1/owner/*` expanded with functional owner console APIs (overview/tenants/users/support/diagnostics/audit)

## Before/after route map

### Before

- Public auth could route directly into `/subscribe` after sign-up.
- Dashboard onboarding was project-count based, non-persistent, and not persona-driven.
- Team route existed but no dashboard sidebar entry.
- Owner route protected but placeholder text only.
- Invite acceptance UI had minimal context and no mobile app guidance.

### After

- Auth post-login/register targets dashboard flow (`next` preserved), not forced subscription.
- Persistent onboarding profile implemented via `user_onboarding_profiles`.
- Tenant creation is explicit onboarding action; implicit auto-create removed.
- Invite acceptance and onboarding honor invite path and avoid accidental tenant creation.
- Dashboard sidebar includes `Team` (owner/admin only) and `Support`.
- Owner cabinet `/[locale]/owner` is functional with live data sections.
- Optional explicit owner entry added: `/owner-entry` -> `/ru/owner`.

## Changed files (high-signal)

- `apps/web/lib/api/engine.ts`
- `apps/web/lib/onboarding/user-onboarding.ts`
- `apps/web/supabase/migrations/20260525210000_cabinet_architecture_recovery.sql`
- `apps/web/components/onboarding/OnboardingWizard.tsx`
- `apps/web/components/onboarding/OnboardingGate.tsx`
- `apps/web/app/[locale]/(auth)/login/page.tsx`
- `apps/web/app/[locale]/(auth)/register/page.tsx`
- `apps/web/app/[locale]/invite/accept/page.tsx`
- `apps/web/components/DashboardShell.tsx`
- `apps/web/app/[locale]/(dashboard)/layout.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/support/*`
- `apps/web/app/[locale]/(owner)/owner/*`
- `apps/web/app/api/v1/onboarding/*`
- `apps/web/app/api/v1/support/*`
- `apps/web/app/api/v1/owner/*` (new overview/tenants/users/support/diagnostics/audit endpoints)
- `apps/web/app/api/v1/mobile-links/route.ts`
- `apps/web/app/api/v1/tenant/invite-preview/route.ts`
- `apps/web/app/api/*` legacy wrappers for activation/tenant invite flows
- `apps/web/messages/{en,ru,es,it}.json`

## Validation commands and results

- `bun run lint` -> PASS
- `bun run test` -> PASS (1471 tests)
- `bun run build` -> PASS
- `bun run cf:build` -> PASS

## Remaining external steps

- Apply Supabase migration:
  - `apps/web/supabase/migrations/20260525210000_cabinet_architecture_recovery.sql`
- Configure mobile link env vars as needed:
  - `APP_STORE_WORKER_URL`
  - `GOOGLE_PLAY_WORKER_URL`
  - `APP_STORE_MANAGER_URL`
  - `GOOGLE_PLAY_MANAGER_URL`
- Re-run full production-grade validation after migration apply.

## Closure verdict

NOT CLOSED

Reason:
- Live-like route smoke scenarios (anonymous owner denial, invite registration join, support round-trip with owner reply) were not executed in a deployed runtime in this pass.
- Database migration must still be applied in target environments before production closure.
