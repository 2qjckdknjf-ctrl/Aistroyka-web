# Integration Prerequisite Map — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## Backend / API

### Migration Prerequisites
- None approved now.
- If backend/API phase includes AI routes, it must first resolve:
  - `20260617120000_ai_flywheel_foundation.sql`
  - `20260617140000_ai_gold_memory.sql`
  - `20260617160000_ai_expert_review_queue.sql`

### Contract/API Prerequisites
- Decide whether to add:
  - `/api/v1/projects/export`
  - `/api/v1/reports/export`
  - report review PATCH side effects: approval event, sync change, notification
  - legacy `/api/tenant/members` redirect to `/api/v1/tenant/members`
- Confirm current DB tables/functions already support report approval events, sync change log, notifications, and export jobs.

### Env / Flags
- No new env flags for generic backend/API exports identified.
- AI-related backend endpoints require AI/Flywheel flags if integrated.

### Validation Before Integration
- Fix local Volta/node blocker.
- Route tests for affected endpoints.
- Tenant/auth/RLS tests.
- API v1 compatibility smoke.
- Mobile compatibility check for report routes.

## AI

### Migration Prerequisites
- AI Flywheel foundation:
  - tenant `ai_training_consent`
  - `ai_preference_pairs`
  - `ai_expert_reviews`
- Gold Memory:
  - `ai_gold_memory`
- Expert Review Queue:
  - `ai_expert_review_queue`

### Contract/API Prerequisites
- `/api/v1/ai/feedback`
- `/api/v1/tenant/ai-training-consent`
- `/api/v1/tenant/ai-expert-review-queue`
- `/api/v1/tenant/ai-expert-review-queue/[id]/submit`
- `/api/v1/tenant/ai-expert-review-queue/[id]/skip`
- Copilot stream route compatibility if preference-pair capture is enabled.

### Env / Flags
- AI Flywheel flags.
- Gold Memory flags.
- Expert Review Queue flags.
- Live provider env if any route calls model providers.
- Service-role access for internal tables; do not expose to browser clients.

### Validation Before Integration
- Live DB migration history comparison.
- RLS/security review for deny-all policies and service role access.
- Customer finance isolation review for AI dataset/Gold Memory.
- PII scrub tests.
- AI unit tests.
- `bash scripts/smoke/ai_live_provider.sh --require-live` before live AI claims.

## Frontend / Design

### Migration Prerequisites
- None for public Liquid Glass pages.
- Admin AI surfaces require AI migrations and routes above.
- Owner/customer/client portal surfaces must not depend on internal cost/AI finance data.

### Contract/API Prerequisites
- Confirm dashboard/admin AI UI does not render unless AI routes and flags exist.
- Confirm export buttons/surfaces do not render unless export routes exist.
- Confirm owner/client portal routes use customer-facing commercial data only.

### Env / Flags
- Feature flags for AI/admin surfaces.
- Existing auth/session env for dashboard routes.

### Validation Before Integration
- i18n check.
- Route reachability smoke.
- Auth/role gates.
- Customer finance isolation.
- Web build and Cloudflare build after Node/Volta blocker is fixed.

## Mobile

### Migration Prerequisites
- None identified directly in `release/mobile-pilot-rc`.
- Mobile report/export/sync behavior may require existing main report approval, notifications, sync, and export job tables to be verified.

### Contract/API Prerequisites
- Worker/report route contracts.
- `/api/v1/reports/[id]` PATCH review behavior if mobile consumes review status.
- `/api/v1/projects/export` and `/api/v1/reports/export` if mobile/manager UI expects exports.
- Auth/session behavior for Manager/Worker clients.
- API v1 allow-list behavior for lite clients.

### Env / Flags
- Mobile build/signing config remains separate and must not include secrets.
- Pilot/E2E credentials via gitignored config only.

### Validation Before Integration
- iOS build and UITest smoke.
- Android build/bundle without secrets.
- Mobile API contract smoke.
- Sync conflict route tests.
- Auth/login smoke for Manager and Worker.

## Global Blocker
- Node/Volta bad-CPU toolchain issue is a hard blocker before any product-code port, contract build, test, web build, or Cloudflare build.
