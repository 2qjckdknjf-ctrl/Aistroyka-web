# Backend / API Integration Decision — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

No backend/API code was ported.

| Area | Branch/source | Files | Risk | Decision | Integration method | Required prerequisite | Required validation |
|---|---|---|---|---|---|---|---|
| Projects CSV export | `release/mobile-pilot-rc` | `apps/web/app/api/v1/projects/export/route.ts`, export service/libs | P1 | `manual_review_again` | future manual port or small reviewed commit | export service review, tenant/customer finance checks | route tests, tenant auth tests, CSV content tests |
| Reports CSV export | `release/mobile-pilot-rc` | `apps/web/app/api/v1/reports/export/route.ts`, export service/libs | P1 | `manual_review_again` | future manual port or small reviewed commit | report export scope/range review | route tests, tenant auth tests, CSV content tests |
| Report review side effects | `release/mobile-pilot-rc` | `apps/web/app/api/v1/reports/[id]/route.ts`, report approval repo, sync, notifications | P1 | `manual_review_again` | future manual port only with side-effect tests | DB support confirmed for approval events/sync/notifications | report route tests, sync tests, notification tests |
| Legacy tenant members canonicalization | `chore/phase13-operator-refresh` | `apps/web/app/api/tenant/members/route.ts` | P0/P1 | `blocked_by_auth_risk` | no port until callers/semantics reviewed | legacy consumer inventory and v1 parity proof | auth/tenant tests, dashboard/mobile smoke |
| Middleware/API security behavior | `hotfix/middleware-matcher-and-headers`, `feat/p0-deps-and-security-headers` | `apps/web/middleware.ts`, `apps/web/next.config.js`, security headers | P0 | `blocked_by_auth_risk` | separate middleware/security phase | route matrix for public/auth/dashboard/API/_next/data | middleware tests, login smoke, API smoke |
| AI feedback/consent routes | AI branches | `apps/web/app/api/v1/ai/feedback/route.ts`, `apps/web/app/api/v1/tenant/ai-training-consent/route.ts` | P0 | `blocked_by_migration` | no backend/API port yet | AI Flywheel migration/RLS/flags review | AI route tests, migration sanity, live AI smoke later |
| Expert Review Queue routes | `ai/expert-review-queue-mvp`, `ai/gold-memory-mvp` | `apps/web/app/api/v1/tenant/ai-expert-review-queue/*` | P0 | `blocked_by_migration` | no backend/API port yet | Expert Review Queue migration/admin RBAC | admin route tests, RLS review |
| Contracts build script drift | web/design/AI branches | `packages/contracts/package.json` | P3/P2 | `ignore_stale` | ignore in backend/API phase | toolchain phase if needed | contracts build already passes |
| Security header package/lock drift | `feat/p0-deps-and-security-headers` | package-lock files, header tests/libs | P2/P3 | `ignore_stale` | none | current main already has security header smoke/policy | baseline validation already passes |

## Summary
- Safe to port now: NO.
- Safe to port later after review:
  - export routes
  - report review side effects
- Blocked items:
  - legacy tenant members redirect
  - middleware/security matcher changes
  - AI feedback/consent/queue routes
- Next group recommendation: backend/API implementation can start with export/report routes only after a focused design/test plan; AI and middleware stay blocked.
