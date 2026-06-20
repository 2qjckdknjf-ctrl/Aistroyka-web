# Backend / API Branch Diffs — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

| Branch | Changed API routes | Changed services/libs | Contracts | Auth/tenant/middleware | Report/export | AI routes | Mobile-facing | Migrations | Risk | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|
| `release/web-pilot-rc` | none | 16 public/design/SEO/AI component-support libs | `packages/contracts/package.json` only | none relevant; SEO false positive | none | Copilot UI component only | none | none | P3/P2 | ignore for backend/API; handle in frontend/design phase |
| `release/mobile-pilot-rc` | 4: `projects/export`, `reports/export`, `reports/[id]`, report test | 6 report/export/notification/sync libs | none | `apps/web/lib/supabase/middleware.ts` changed | export endpoints; report review side effects | none direct | report/export/sync paths | none | P1 | manual review before port |
| `ai/gold-memory-mvp` | 10 AI/tenant AI routes | 76 AI Flywheel/Gold Memory/feedback libs | `packages/contracts/package.json` only | tenant AI routes and AI services | expert review queue services | feedback, consent, queue, Copilot stream | none | 3 AI migrations | P0 | blocked by migration and AI review |
| `ai/expert-review-queue-mvp` | 10 AI/tenant AI routes | 62 AI Flywheel/queue/libs | none | tenant AI routes | expert review queue services | feedback, consent, queue, Copilot stream | none | 3 AI migrations | P0 | blocked by migration and admin RBAC review |
| `ai/flywheel-final-tail-closure` | 7 AI/consent/Copilot routes | 32 AI Flywheel/feedback libs | none | tenant AI consent route | export-dry-run service only | feedback, consent, Copilot stream | none | 1 AI migration | P0 | blocked by migration and consent review |
| `design/liquid-glass-public-shell-lg2a` | same AI route set as Gold Memory branch | same broad AI libs plus design libs | `packages/contracts/package.json` only | tenant AI routes | expert review queue services | AI feedback/queue/consent | none | 3 AI migrations | P0 | do not use design branch as backend source |
| `feature/unified-product-design-certification` | AI routes plus `projects/export`, `reports/export`, `reports/[id]` | AI + report/export/notification/sync libs | `packages/contracts/package.json` only | tenant AI routes | export/report + expert review queue | AI feedback/queue/consent | report/export/sync | 3 AI migrations | P0 | too broad; use narrower source branches |
| `hotfix/middleware-matcher-and-headers` | none in API path filter | none in lib path filter | none | middleware changed outside this path filter | none | none | none | none | P0 for middleware, not API shape | manual review later |
| `feat/p0-deps-and-security-headers` | `apps/web/app/api/security-headers.test.ts` | security header libs/tests | package-lock files only | security header behavior | none | none | none | none | P1/P2 | ignore for backend/API shape |
| `chore/phase13-operator-refresh` | legacy `apps/web/app/api/tenant/members/route.ts` | none | none | tenant members legacy route | none | none | possible legacy callers | none | P0/P1 | manual review before canonicalization |

## Main Findings
- Backend/API route additions that are not AI:
  - `GET /api/v1/projects/export`
  - `GET /api/v1/reports/export`
  - report review PATCH side effects in `PATCH /api/v1/reports/[id]`
  - legacy `/api/tenant/members` redirect to `/api/v1/tenant/members`
- AI routes remain blocked because their migrations are not in main and were classified P0.
- Middleware/security branches are not backend/API shape sources in this phase.
