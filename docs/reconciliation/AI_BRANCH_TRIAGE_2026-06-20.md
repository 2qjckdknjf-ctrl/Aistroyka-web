# AI Branch Triage — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## ai/gold-memory-mvp

### Code Presence
- AI routes: YES. Includes feedback, transcribe, Copilot stream, AI training consent, and Expert Review Queue tenant routes.
- Services: YES. Includes `apps/web/lib/platform/ai-flywheel/gold-memory/*`, feedback capture, PII scrub, finance dataset guard, retrieval/prompt/embedder/repository modules.
- Providers: PARTIAL/UNKNOWN. Branch touches AI feature APIs and Copilot flow; provider runtime behavior still requires live env validation.
- Migrations: YES. Includes `20260617120000_ai_flywheel_foundation.sql`, `20260617140000_ai_gold_memory.sql`, and `20260617160000_ai_expert_review_queue.sql`.
- Tests: YES. 38 test/spec paths detected in diff.
- Docs: YES. Extensive `docs/ai-flywheel/*` and design docs.
- Flags: YES. Gold Memory and Flywheel flag files are present.
- UI/admin surfaces: YES. Includes admin AI Expert Review and Training Consent pages plus public Copilot/design surfaces.

### Main Containment
- Already in main: PARTIAL.
- Missing from main: Gold Memory service/retrieval/prompt/embedder/repository stack, AI Flywheel artifacts, admin AI queue/consent surfaces, AI migrations.
- Replaced by newer main code: UNKNOWN. Main has some AI work, but this branch is ahead and broad; replacement must be checked file-by-file.
- Conflicts expected: HIGH, especially around AI routes, public marketing/design surfaces, tenant/admin UI, migrations, and messages.

### Runtime Dependencies
- Supabase migration needed: YES.
- Env flags needed: YES.
- OpenAI/API provider needed: YES/POSSIBLE.
- RLS/security implications: HIGH. This branch touches tenant AI APIs and training/feedback data paths. Customer finance isolation must be verified before any data capture/export logic is enabled.

### Integration Decision
- Merge full branch: NO.
- Cherry-pick selected commits: POSSIBLE LATER.
- Keep out of main: YES until schema/RLS/provider/flag review is complete.
- Manual review required: YES.
- Decision: `manual_review_again`.

## ai/expert-review-queue-mvp

### Code Presence
- AI routes: YES. Includes tenant Expert Review Queue list/skip/submit routes.
- Services: YES. Includes candidate builder, guard, flags, observability, repository, submission, UI gate, and types.
- Providers: NO direct provider evidence; it likely consumes existing AI output/workflow data.
- Migrations: YES. Includes Expert Review Queue migration.
- Tests: YES. 31 test/spec paths detected.
- Docs: YES. Includes Expert Review Queue readiness, data model, flags, UI, validation, and CI evidence docs.
- Flags: YES. Includes Expert Review Queue flags and UI gate.
- UI/admin surfaces: YES. Includes admin Expert Review Queue client/page and admin AI overview link changes.

### Main Containment
- Already in main: PARTIAL.
- Missing from main: Expert Review Queue admin workflow, queue routes, repository/submission services, queue migration, queue tests.
- Replaced by newer main code: UNKNOWN.
- Conflicts expected: HIGH around tenant APIs, admin AI route layout, migration order, and shared AI Flywheel modules.

### Runtime Dependencies
- Supabase migration needed: YES.
- Env flags needed: YES.
- OpenAI/API provider needed: POSSIBLE INDIRECT.
- RLS/security implications: HIGH. Expert review queue data must remain internal/admin-only and must not leak customer-facing internal AI or finance signals.

### Integration Decision
- Merge full branch: NO.
- Cherry-pick selected commits: POSSIBLE LATER, preferably only the queue module after foundational AI Flywheel migrations are accepted.
- Keep out of main: YES until AI foundation and RLS review pass.
- Manual review required: YES.
- Decision: `manual_review_again`.

## ai/flywheel-final-tail-closure

### Code Presence
- AI routes: YES. Includes AI feedback and training consent routes, plus Copilot stream test/route changes.
- Services: YES. Includes AI feedback capture/wiring, behavior safety, consent, PII scrub, finance dataset guard, flags, export dry-run.
- Providers: PARTIAL/UNKNOWN. Provider behavior depends on existing Copilot/AI provider wiring.
- Migrations: YES. Includes AI Flywheel foundation migration.
- Tests: YES. 19 test/spec paths detected.
- Docs: YES. Includes AI Flywheel validation, closure, readiness, and CI evidence docs.
- Flags: YES. Includes Flywheel flag files.
- UI/admin surfaces: YES. Includes training consent admin surface.

### Main Containment
- Already in main: PARTIAL.
- Missing from main: AI feedback capture hardening, training consent routes/admin, AI Flywheel foundation data model, related tests/docs.
- Replaced by newer main code: UNKNOWN. Later AI branches appear to build on this branch rather than replace it.
- Conflicts expected: MEDIUM-HIGH because the branch has only 2 commits ahead but those commits touch foundational AI routes, migrations, and flags.

### Runtime Dependencies
- Supabase migration needed: YES.
- Env flags needed: YES.
- OpenAI/API provider needed: POSSIBLE.
- RLS/security implications: HIGH. Feedback capture/export/dataset code must be checked for PII scrub and finance isolation before activation.

### Integration Decision
- Merge full branch: NO.
- Cherry-pick selected commits: POSSIBLE LATER after migration and route review.
- Keep out of main: YES until foundational AI Flywheel scope is approved.
- Manual review required: YES.
- Decision: `manual_review_again`.

## AI Integration Conclusion
- No AI branch is safe for a full merge.
- The correct integration strategy is staged:
  1. Review and accept/reject AI Flywheel foundation schema and consent model.
  2. Integrate feedback capture only behind flags.
  3. Integrate Gold Memory schema/services only after provider and RLS review.
  4. Integrate Expert Review Queue only after Gold Memory and internal-admin access rules are stable.
  5. Run focused tests, migration sanity, `cf:build`, and live AI smoke before any production claim.
