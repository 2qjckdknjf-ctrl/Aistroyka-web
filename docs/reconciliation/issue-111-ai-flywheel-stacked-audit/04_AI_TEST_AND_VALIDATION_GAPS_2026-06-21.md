# AI Test and Validation Gaps

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Existing Tests in AI Branches

The relevant branches include tests for:

- AI feedback route and capture helpers
- training consent service and route
- feedback UI gates and wire helpers
- behavior safety
- PII scrub and Spain PII edge cases
- finance dataset guard
- export dry-run
- Gold Memory builder, embedder, flags, guard, prompt, retriever
- Expert Review Queue flags, guard, candidate builder, UI gate, submission
- Copilot stream changes

Observed counts against PR #109:

|Branch|Test files changed|
|---|---:|
|`origin/ai/flywheel-final-tail-closure`|18|
|`origin/ai/expert-review-queue-mvp`|29|
|`origin/ai/gold-memory-mvp`|36|

## Missing Tests Before Integration

Required before any AI schema/runtime PR:

- Migration tests or local database validation proving new tables and deny-all RLS exist.
- Route tests for `/api/v1/tenant/ai-training-consent`:
  - anonymous denied
  - tenant member denied
  - viewer denied
  - stakeholder/customer denied
  - owner/admin allowed
  - cross-tenant blocked
  - service-role unavailable returns safe 503
- Route tests for `/api/v1/tenant/ai-expert-review-queue/*`:
  - flags off returns 404
  - non-admin roles denied
  - admin list/submit/skip paths tenant-scoped
  - malformed payload rejected
  - audit/log behavior has no PII
- Gold Memory tests:
  - no prompt injection unless all read/prompt flags are explicitly enabled
  - no write without consent snapshot and finance guard pass
  - tenant isolation for retrieval
  - missing provider/embedder fallback is explicit and non-live
- Customer finance tests:
  - owner/customer audience examples reject internal finance terms
  - manager/internal audience labels are not accidentally exposed to owner/customer APIs
- Runtime smoke tests:
  - staging admin can load disabled UI safely
  - staging admin cannot access queue when flags/schema are missing
  - no customer/owner route exposes AI training artifacts

## Validation Gaps

Current blockers:

- PR #109 is not merged, so AI work remains stacked and must not target `main` yet.
- No live Supabase schema check was performed in this audit.
- No migration was run locally or in staging.
- No staging smoke users or data were created.
- No live AI provider evidence was generated.
- No flags were toggled.

## Required Staging Plan

Before enabling any AI Flywheel runtime:

1. Merge and validate PR #109 baseline.
2. Create a schema-only PR with flags default off.
3. Run local DB migration validation.
4. Apply only to staging after operator approval.
5. Verify RLS deny-all with anon/authenticated users.
6. Verify service-role paths only through owner/admin server routes.
7. Create isolated smoke data and clean it up.
8. Run full validation and focused route tests.
9. Only then plan UI/runtime activation behind flags.

## Validation Verdict

Existing tests are useful but insufficient for production or staging activation. The next PR must be schema/route-audit focused, not a broad AI feature merge.
