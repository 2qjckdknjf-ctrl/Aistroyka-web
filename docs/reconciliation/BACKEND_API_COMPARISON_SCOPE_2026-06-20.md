# Backend / API Comparison Scope — 2026-06-20

## Purpose
Read-only comparison of backend/API deltas outside `origin/main`.

## Branches To Inspect
- `release/web-pilot-rc`
- `release/mobile-pilot-rc`
- `ai/gold-memory-mvp`
- `ai/expert-review-queue-mvp`
- `ai/flywheel-final-tail-closure`
- `design/liquid-glass-public-shell-lg2a`
- `feature/unified-product-design-certification`
- `hotfix/middleware-matcher-and-headers`
- `feat/p0-deps-and-security-headers`
- `chore/phase13-operator-refresh`

## Route Families
- export/report routes
- report review routes
- legacy `/api/*` canonicalization
- canonical `/api/v1/*`
- tenant/auth routes
- middleware-adjacent API behavior
- mobile-facing worker/sync/report/device/upload routes
- AI feedback/consent/queue routes as dependencies only

## Risk Categories
- P0: auth/tenant exposure, customer finance exposure, destructive schema behavior, API contract break for current clients.
- P1: backend/frontend/mobile mismatch, missing prerequisites, routes requiring migrations not in main.
- P2: useful but non-blocking route additions.
- P3: stale branch or package/build-only drift.

## Files Likely Involved
- `apps/web/app/api/**`
- `apps/web/lib/domain/reports/**`
- `apps/web/lib/platform/exports/**`
- `apps/web/lib/platform/jobs/**`
- `apps/web/lib/sync/**`
- `apps/web/lib/tenant/**`
- `apps/web/lib/supabase/**`
- `apps/web/middleware.ts`
- `packages/contracts/**`
- `packages/contracts-openapi/**`
- `apps/web/supabase/migrations/**`

## Out Of Scope
- Code porting.
- Migration apply.
- AI runtime enablement.
- Frontend/mobile integration.
- Deployment.
