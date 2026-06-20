# Updated Plan After DB / Contracts — 2026-06-20

## 1. Are Database / Contracts Safe To Integrate Now?
No.

Reasons:
- Three current missing migrations are AI-related and have RLS/security/data-governance implications.
- One older missing RLS/index migration comes from a very stale branch and likely conflicts with newer main hardening migrations.
- API shape changes are tied to backend, AI, frontend, or mobile runtime code that has not been integrated.
- Product validation is blocked locally by the Volta/node bad-CPU executable issue.

## 2. If Later, Which Exact Files Are Candidates?

### AI Schema Candidates
- `apps/web/supabase/migrations/20260617120000_ai_flywheel_foundation.sql`
- `apps/web/supabase/migrations/20260617140000_ai_gold_memory.sql`
- `apps/web/supabase/migrations/20260617160000_ai_expert_review_queue.sql`

These should likely be rewritten as new migrations later, not copied with old timestamps, after comparing live DB migration history.

### API Shape Candidates
- `apps/web/app/api/v1/ai/feedback/route.ts`
- `apps/web/app/api/v1/tenant/ai-training-consent/route.ts`
- `apps/web/app/api/v1/tenant/ai-expert-review-queue/route.ts`
- `apps/web/app/api/v1/tenant/ai-expert-review-queue/[id]/submit/route.ts`
- `apps/web/app/api/v1/tenant/ai-expert-review-queue/[id]/skip/route.ts`
- `apps/web/app/api/v1/projects/export/route.ts`
- `apps/web/app/api/v1/reports/export/route.ts`
- report review PATCH changes in `apps/web/app/api/v1/reports/[id]/route.ts`
- legacy canonicalization in `apps/web/app/api/tenant/members/route.ts`

### Contract Build Candidate
- `packages/contracts/package.json` build-script change is not a contract shape change and should be deferred to a toolchain/build-system phase.

## 3. What Blocks DB / Contracts?
- Live Supabase migration history not compared.
- RLS/security review not complete for AI service-role-only tables.
- Customer finance isolation review not complete for Gold Memory and AI dataset flows.
- Backend/API route behavior not reviewed with schema.
- Local Node/Volta validation blocker prevents install/build/test/contract build.

## 4. Should Backend/API Be Next?
Backend/API can be the next comparison phase, but not an implementation phase yet.

Recommended next scope:
- Compare export/report API changes from `release/mobile-pilot-rc`.
- Compare legacy `/api/tenant/members` canonicalization from `chore/phase13-operator-refresh`.
- Compare AI route contracts only after deciding whether AI schema is desired.

## 5. Should AI Remain Blocked Until DB / Contracts Are Resolved?
Yes.

AI runtime remains blocked until:
- AI migrations are reviewed/rebased.
- RLS and service-role-only access are verified.
- flags/env/provider requirements are confirmed.
- PII and customer finance guards are validated.

## 6. Should Frontend Remain Blocked Until Backend/API Shape Is Confirmed?
Yes.

Frontend/design integration may proceed only for purely static/public design slices. Any dashboard/admin/owner/client UI that depends on APIs must wait for backend/API shape decisions.

## 7. Should Mobile Remain Deferred?
Yes.

Mobile remains deferred until:
- API v1 report/export/sync behavior is decided.
- auth/session behavior is validated.
- signing/build config is reviewed without secrets.

## 8. Is Node/Volta Validation Blocker A Hard Blocker Before Product-Code Port?
Yes.

No product-code, migration, contract, API, frontend, AI, or mobile port should begin until install/build/test can run.

## 9. Next Exact Step
Fix the local Node/Volta toolchain blocker, then run a backend/API comparison phase focused on export/report routes and legacy API canonicalization. Do not apply migrations or port AI runtime code yet.
