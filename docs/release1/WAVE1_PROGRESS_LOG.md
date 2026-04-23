# Wave 1 — Progress log (append-only)

## 2026-03-27 — Wave 1 implementation pass

- Read `PHASE1_FINAL_SCOPE.md`, `PHASE1_EXCLUDES.md`, `PHASE1_EXECUTION_WAVES.md`, `PHASE1_ACCEPTANCE_GATES.md`, `WAVE09_FINAL_UNLOCK.md`, `HOTFIX_FINAL_VERDICT.md`.
- Audited `createClient()` vs `createClientFromRequest(request)` on routes using `getTenantContextFromRequest`.
- Identified defect class: tenant context from Bearer, DB client from cookies only → RLS mismatch for API clients.
- Applied surgical fix to:
  - `api/v1/workers/[userId]/summary/route.ts`
  - `api/v1/workers/[userId]/days/route.ts`
  - `api/v1/projects/[id]/workers/route.ts`
  - `api/v1/sync/bootstrap/route.ts`
  - `api/v1/sync/changes/route.ts`
  - `api/v1/sync/ack/route.ts`
- Updated `sync/changes/route.test.ts`, `sync/ack/route.test.ts` mocks to `createClientFromRequest`.
- **Tests:** `vitest` sync routes — pass; `npm run test` — **1112** passed.
- **Smoke:** `pilot_launch.sh` — **PASS**, exit 0.
- **Decision:** Wave 1 implementation **complete**; documented in `WAVE1_FINAL_STATUS.md` (verdict **WAVE1_COMPLETE**).
