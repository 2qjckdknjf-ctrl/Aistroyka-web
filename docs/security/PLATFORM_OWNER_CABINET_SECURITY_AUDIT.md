# PLATFORM OWNER CABINET SECURITY AUDIT

Date: 2026-05-25  
Project: AISTROYKA

## Root cause

- Platform owner cabinet route existed with strong gate controls, but business functionality was mostly placeholder.  
- Lack of operational owner features increased pressure to route admin-like actions elsewhere, risking future boundary erosion.

## Security model verified and preserved

- Owner route isolation remains:
  - Page: `/[locale]/owner`
  - Optional entry redirect: `/owner-entry -> /ru/owner`
- Gate enforcement preserved:
  - middleware owner gate
  - layout assertion (`assertPlatformOwnerPageAccess`)
  - API assertion (`requirePlatformOwnerApi`)
- Access basis preserved:
  - `platform_owner_grants` role-based allow (`OWNER` and tiered owner roles)
- Optional hardening preserved:
  - owner host allowlist
  - owner IP allowlist
  - optional owner secret header for critical APIs
  - step-up header for critical owner actions

## New owner APIs added (all guarded)

- `/api/v1/owner/overview`
- `/api/v1/owner/tenants`
- `/api/v1/owner/tenants/[tenantId]`
- `/api/v1/owner/users`
- `/api/v1/owner/support/tickets`
- `/api/v1/owner/support/tickets/[ticketId]/messages`
- `/api/v1/owner/diagnostics`
- `/api/v1/owner/audit`

All routes call `requirePlatformOwnerApi(...)` before data operations.

## Customer/portal boundary checks

- `/portal` customer surface preserved and separate.
- No public navigation was added to `/owner`.
- No owner APIs exposed to non-owner route spaces.
- No internal company finance data projected to customer/owner portal routes as part of this change set.

## Audit/logging

- Existing platform owner API guard logging and DB audit insertion remain active (`platform_owner_audit_log`).
- New owner surface uses guarded APIs, inheriting audit trail behavior.

## Changed files

- `apps/web/app/[locale]/(owner)/owner/page.tsx`
- `apps/web/app/[locale]/(owner)/owner/owner-console-client.tsx`
- `apps/web/app/owner-entry/route.ts`
- `apps/web/app/api/v1/owner/*` (new functional routes listed above)
- `apps/web/supabase/migrations/20260525210000_cabinet_architecture_recovery.sql` (support persistence layer)

## Validation commands/results

- `bun run lint` -> PASS
- `bun run test` -> PASS (1471 tests)
- `bun run build` -> PASS
- `bun run cf:build` -> PASS

## Remaining external steps

- Apply migration to production/staging database.
- Execute owner/non-owner access smoke:
  - owner user can access `/owner` + owner APIs
  - normal user denied `/owner` + `/api/v1/owner/*`
- Verify owner support round-trip with real user accounts.

## Final verdict

NOT CLOSED

Reason:
- Runtime owner/non-owner access smoke in staging/production-like environment remains pending.
