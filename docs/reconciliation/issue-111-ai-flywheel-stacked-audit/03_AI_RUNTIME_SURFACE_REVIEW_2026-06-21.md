# AI Runtime Surface Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

This audit inspected branch contents only. No runtime routes were enabled, no flags were changed, and no live data was touched.

## Runtime Surfaces Found

|Surface|Branches|Files / paths|Gate shape observed|Risk|
|---|---|---|---|---|
|AI training consent API|AI branches|`/api/v1/tenant/ai-training-consent`|Requires tenant context and `hasMinRole(..., "admin")`; PATCH uses service-role admin client.|Medium/high: depends on new tenant column and service-role update path.|
|Expert Review Queue API|Expert review / gold memory branches|`/api/v1/tenant/ai-expert-review-queue/*`|Feature flags plus tenant admin check; service-role list/submit/skip.|High: exposes scrubbed internal queue JSON to admin UI; needs route tests and staging data.|
|Admin training consent UI|AI branches|`/admin/ai/training-consent`|Dashboard admin surface; client calls tenant consent API.|Medium: UI must be hidden unless schema/flags/API are ready.|
|Admin expert review UI|AI branches|`/admin/ai/expert-review`|UI gate uses Expert Review Queue flags.|High: should remain unavailable until queue and RLS are validated.|
|Copilot feedback capture|AI branches|`apps/web/lib/features/ai/**`, Copilot panel, feedback route|Feature flags default off; captures preference-pair style feedback.|High: must avoid collecting data without explicit consent and admin policy.|
|Gold Memory prompt/retrieval|Gold memory branch|`apps/web/lib/platform/ai-flywheel/gold-memory/**`|Gold flags default off and have separate read/write/prompt-injection gates.|High: prompt injection into runtime must remain disabled until validated.|

## Flags and Kill Switches

Observed branch flags default to off:

- `AI_FLYWHEEL_ENABLED`
- `AI_TRAINING_CONSENT_UI_ENABLED`
- `AI_FEEDBACK_CAPTURE_ENABLED`
- `AI_EXPERT_REVIEW_ENABLED`
- `AI_DATASET_EXPORT_ENABLED`
- `AI_SHADOW_MODE_ENABLED`
- `AI_GOLD_MEMORY_ENABLED`
- `AI_GOLD_MEMORY_WRITE_ENABLED`
- `AI_GOLD_MEMORY_READ_ENABLED`
- `AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED`
- `AI_EXPERT_REVIEW_QUEUE_ENABLED`
- `AI_EXPERT_REVIEW_WRITE_ENABLED`
- `AI_EXPERT_REVIEW_ADMIN_UI_ENABLED`
- `AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED`

Flag posture is conservative, but flags alone are not sufficient. Runtime routes must still be safe if accidentally deployed with schema absent or flags misconfigured.

## Consent and Customer Finance Boundaries

Positive signs:

- Training consent defaults false.
- Consent helper treats only explicit true as eligible.
- Finance dataset guard blocks internal finance vocabulary for owner/customer audience examples.
- Queue guard runs PII scrub validation and finance guard before candidate payload acceptance.

Open risks:

- Need tests proving non-admin tenant roles cannot read/update consent or queue data.
- Need tests proving customer/owner/stakeholder surfaces cannot reach internal AI queue or training data.
- Need evidence that training export and Gold Memory builder never ingest customer-facing data containing internal company financial state.
- Need retention/deletion policy for stored examples and embeddings.

## Production Exposure Risk

Current PR #109 baseline does not include these AI Flywheel runtime surfaces. That is the safe state.

If branch code is ported later, the biggest production risks are:

- service-role helpers called behind insufficient route authorization
- AI tables existing with sensitive JSON but no operational retention model
- admin AI pages visible before migrations/flags/staging data are ready
- Gold Memory prompt injection enabled without strong evidence and fallback labeling
- customer finance leakage into owner/customer audience training examples

## Runtime Verdict

AI runtime surfaces safe to enable now: NO.

Flags safe to enable now: NO.

Next runtime step: create an audit-first schema/route test PR that keeps all flags off and proves denied access paths before any UI or runtime activation.
