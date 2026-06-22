# Contract / API Gap Matrix — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

No contracts, schemas, routes, generated OpenAPI files, or client types were edited.

| Branch | Files | Affected route/domain | Current main behavior | Branch behavior | Compatibility risk | Mobile impact | Frontend impact | AI impact | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| `ai/flywheel-final-tail-closure` | `apps/web/app/api/v1/ai/feedback/route.ts`, `apps/web/app/api/v1/tenant/ai-training-consent/route.ts`, `apps/web/lib/platform/ai-flywheel/*`, `apps/web/lib/features/ai/api/*` | AI feedback capture, training consent, Copilot preference pairs | Main has partial AI/Copilot runtime but not these Flywheel DB-backed endpoints | Adds training-consent route, feedback capture wiring, Flywheel service/flag/test stack | P1/P0: route behavior depends on missing migration and service-role/RLS assumptions | Low direct mobile unless clients submit AI feedback | Admin/dashboard AI surfaces depend on this | High: foundational AI Flywheel | `manual_review` |
| `ai/gold-memory-mvp` | Gold Memory services/types plus AI feedback/training consent/Expert Review Queue route set | Gold Memory retrieval/building, AI memory prompt/retrieval | Main lacks DB-backed Gold Memory MVP stack | Adds builder, embedder, prompt, retriever, repository, observability, guard, flags | P1/P0: schema, provider/env, PII scrub, finance guard dependencies | Possible later if mobile AI feedback participates | Admin AI and Copilot quality features depend on it | High: core Gold Memory | `manual_review` |
| `ai/expert-review-queue-mvp` | `apps/web/app/api/v1/tenant/ai-expert-review-queue/*`, `apps/web/lib/platform/ai-flywheel/expert-review-queue/*` | Internal admin Expert Review Queue | Main lacks queue routes/services | Adds queue list/skip/submit APIs and internal service stack | P1/P0: internal/admin access and migration dependencies | None direct | Admin AI review UI depends on it | High: expert review to Gold Memory bridge | `manual_review` |
| `release/mobile-pilot-rc` | `apps/web/app/api/v1/projects/export/route.ts`, `apps/web/app/api/v1/reports/export/route.ts`, `apps/web/app/api/v1/reports/[id]/route.ts`, export/report/notification/sync lib changes | CSV export endpoints; report review PATCH side effects | Main lacks immediate projects/reports export API; report review route is simpler | Adds export endpoints; report review approval events, sync changes, notifications | P1: additive endpoints but report PATCH side effects must match DB tables and clients | Medium/high: mobile pilot may expect report review notifications/sync | Medium: dashboard export buttons may depend on endpoints | Low | `manual_review` |
| `feature/unified-product-design-certification` | AI routes + export/report routes + mobile/design files | Combined AI/export/report/API shape | Main lacks parts above | Bundles AI and mobile/web API shape changes | P0/P1: too broad, mixed concerns | High | High | High | `manual_review`; do not use as primary source |
| `chore/phase13-operator-refresh` | `apps/web/app/api/tenant/members/route.ts`, `docs/audit/LEGACY_API_SURFACE_INVENTORY.md` | legacy `/api/tenant/members` canonicalization | Main serves legacy tenant members implementation | Branch redirects legacy route to `/api/v1/tenant/members` | P0/P1: could break legacy dashboard/mobile callers or auth semantics | Possible if mobile/old clients call legacy route | Possible dashboard legacy fetch impact | None | `manual_review` |
| `release/web-pilot-rc` | `packages/contracts/package.json` | contracts build command | Main uses `tsc -p tsconfig.json` | Branch uses `bun ../../node_modules/typescript/bin/tsc -p tsconfig.json` | P2/P1: toolchain workaround only, no API shape change | None | None | None | `manual_review_later_or_ignore` |
| `design/liquid-glass-public-shell-lg2a` | `packages/contracts/package.json` + AI routes carried from AI branches | design branch carries DB/API changes | Main lacks AI migrations/routes above | Same AI route/schema payload as AI branches | P0: design branch should not be source for DB/API | None direct | Medium if admin AI UI expects APIs | High | `ignore_as_db_source` |
| `feat/p0-deps-and-security-headers` | contracts package-lock files, `apps/web/app/api/security-headers.test.ts` | build/dependency/security header tests | Main already contains security header smoke/policy and contracts package files | Branch deletes/changes lockfiles and tests header constants | P2/P3 for DB/contracts; P1 for package strategy | None | None | None | `ignore_for_db_contracts` |

## API v1 Canonicalization
- `chore/phase13-operator-refresh` proposes redirecting legacy `/api/tenant/members` to `/api/v1/tenant/members`.
- This is a contract/API behavior change, not a database change.
- Recommendation: defer until a backend/API phase can inspect all callers and preserve auth/tenant semantics.

## Generated OpenAPI
- No outside-main generated OpenAPI delta was identified as an integration candidate.
- Do not regenerate OpenAPI until the Node/Volta blocker is fixed and API route decisions are made.

## Contract Package Changes
- `release/web-pilot-rc`, `design/liquid-glass-public-shell-lg2a`, `ai/gold-memory-mvp`, and `feature/unified-product-design-certification` change only `packages/contracts/package.json` build invocation.
- This is a toolchain/build concern, not a contract shape change.
- Recommendation: ignore for now because validation is already blocked by local Node/Volta and broad package changes need their own build-system phase.

## Final Contract/API Verdict
- Safe now: none.
- Manual review: AI routes, export/report routes, legacy tenant members redirect.
- Stale/ignore: contracts build-command drift and lockfile churn for this phase.
