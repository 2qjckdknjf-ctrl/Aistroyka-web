# DB / Contracts Risk Register — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## Risks

| ID | Level | Source branch | File | Affected module | Risk | Impact | Recommendation | Blocker status |
|---|---|---|---|---|---|---|---|---|
| DBC-01 | P0 | AI branches | `20260617120000_ai_flywheel_foundation.sql` | AI Flywheel / tenants | Migration adds tenant consent column and internal AI tables with deny-all RLS | Could conflict with live DB history; consent defaults and service-role access must be verified | Compare live DB, then rewrite as new migration if accepted | BLOCKED |
| DBC-02 | P0 | AI branches | `20260617140000_ai_gold_memory.sql` | Gold Memory | New AI memory table stores scrubbed inputs/outputs and embeddings as JSON | Customer finance/PII leakage risk if service code or RLS is wrong | Manual security review and finance guard review before schema integration | BLOCKED |
| DBC-03 | P0 | AI branches | `20260617160000_ai_expert_review_queue.sql` | Expert Review Queue | New internal queue references tenants and auth users | Admin-only data could leak or fail under RLS if not reviewed | Integrate only after AI foundation and admin RBAC review | BLOCKED |
| DBC-04 | P0 | `origin/cursor/aistroyka-system-maturity-7957` | `20260307000000_fix_missing_rls_and_indexes.sql` | RLS/index hardening | Very old missing migration from stale branch | Applying blindly could duplicate/conflict with 202605 hardening migrations | Ignore unless live DB advisor proves exact remaining gap | BLOCKED |
| DBC-05 | P0 | `origin/cursor/auth-and-dashboard-issues-eb7c` | `20260526090000_user_identities.sql` | Auth/identity | Branch modifies a migration filename already present in main | Editing already-applied migration history is unsafe | Never overwrite; compare live DB only if auth issue reappears | BLOCKED |
| DBC-06 | P1 | `release/mobile-pilot-rc` | `apps/web/app/api/v1/projects/export/route.ts` | Exports / API v1 | Additive export endpoint may require existing service/storage behavior | Frontend/mobile export buttons may fail if route/service not integrated together | Review in backend/API phase with export service tests | OPEN |
| DBC-07 | P1 | `release/mobile-pilot-rc` | `apps/web/app/api/v1/reports/export/route.ts` | Reports export | Additive reports export endpoint may expose tenant data | Tenant scoping and CSV content must be verified | Manual review and tenant-auth tests before integration | OPEN |
| DBC-08 | P1 | `release/mobile-pilot-rc` | `apps/web/app/api/v1/reports/[id]/route.ts` | Report review | PATCH adds approval events, sync changes, and notifications | Existing clients may see new side effects; DB support must be confirmed | Review with report approval/sync/notification tests | OPEN |
| DBC-09 | P0/P1 | `chore/phase13-operator-refresh` | `apps/web/app/api/tenant/members/route.ts` | Legacy tenant API | Legacy route redirects to v1 route | Could break old dashboard/mobile callers or alter auth semantics | Defer to backend/API canonicalization phase | BLOCKED |
| DBC-10 | P1 | AI branches | `apps/web/app/api/v1/tenant/ai-training-consent/route.ts` | AI consent API | Route depends on new `tenants.ai_training_consent` column | Runtime route fails without migration; consent must remain tenant/admin scoped | Integrate only with migration and RBAC checks | BLOCKED |
| DBC-11 | P1 | AI branches | `apps/web/app/api/v1/tenant/ai-expert-review-queue/*` | Expert Review API | Routes depend on queue table and internal admin rules | Admin UI/API mismatch if route integrated without schema | Integrate after schema and admin role validation | BLOCKED |
| DBC-12 | P2 | `release/web-pilot-rc` and design/AI branches | `packages/contracts/package.json` | Contracts build | Build command changed to call TypeScript via Bun path | Could mask or solve local toolchain issues, but not API shape | Ignore until build-system/toolchain phase | OPEN |
| DBC-13 | P2/P3 | `release/publication-readiness-mega-sprint` | 22 older migrations already in main | Supabase hardening/product | Branch copies migrations already represented by filename in main | Possible stale SQL variants but no immediate gap | Keep main; do not backport old branch migration files | CLOSED for integration |
| DBC-14 | P0 | Environment | local Volta/node | Validation | Cannot install/build/test due bad CPU type executable | Product-code ports cannot be safely validated | Fix local Node/Volta before any product integration | BLOCKED |

## Summary
- P0 risks are concentrated around migration history/RLS/security and validation tooling.
- P1 risks are API shape mismatches that can block backend, frontend, AI, or mobile integration.
- No DB/contracts change is safe to port in this docs-only phase.
