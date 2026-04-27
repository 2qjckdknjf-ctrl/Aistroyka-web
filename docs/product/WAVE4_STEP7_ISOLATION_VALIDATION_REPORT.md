# Wave 4 Step 7 — Isolation validation report

**Date:** 2026-03-29

## Commands run

| Command | Result |
|---------|--------|
| `npm run test` (from `apps/web`, Vitest `--run`) | **PASS** — 194 files, 1170 tests |
| `npm run build` (from repo root) | **PASS** — Next.js production build completed |

## Focused tests

- `lib/tenant/stakeholder-dashboard-paths.test.ts`
- `lib/tenant/tenant.policy.test.ts`
- `lib/supabase/middleware.test.ts` (extended for `supabase` return)
- `app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts` (mock `getProjectForInternalWorkspace`)

## Manual / follow-up checks (not automated)

- E2E sign-in as stakeholder in staging: confirm redirects from `/dashboard/tasks` and `/dashboard/projects/[id]`.  
- **DB:** Apply migration `20260330150000_tenant_members_stakeholder_role.sql` to non-local environments before relying on `stakeholder` role inserts.  
- **Legacy users** still on `viewer` from old accept: run corrective `UPDATE` or re-invite (see backend report).
