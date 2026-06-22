# Stale Readiness Claims Matrix

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

This matrix identifies claim classes to clean up later. It does not rewrite source docs.

|File / area|Claim type|Claimed status|Evidence source|Code/runtime confirmed|Current truth|Action needed|Severity|
|---|---|---|---|---|---|---|---|
|`docs/release/PRODUCTION_RELEASE_GO_NO_GO.md`|Production release status|Local validation PASS, production NO-GO, smoke failures, external blockers|File itself plus current PR #109 status|PARTIAL|Historical no-go snapshot. Do not use as current production truth without rerun.|Mark superseded or index as dated release snapshot.|P1|
|`docs/mobile-ios/IOS_FINAL_MOBILE_READINESS_VERDICT.md`|iOS readiness|Phases 0-8 closed; overall NOT PRODUCT-READY|File itself and issue #112|PARTIAL|Still useful because it clearly says not product-ready; needs post-baseline evidence update.|Keep as evidence; update via mobile validation slice after PR #109 merge.|P2|
|`docs/ai-flywheel/**`|AI/Flywheel readiness|Various validation/readiness docs|Issue #111 final verdict|NO for current activation|AI branches contain useful work, but broad merge, migrations, and flags are not safe now.|Add docs index note: evidence-only until schema/RLS/runtime PR exists.|P1|
|`docs/publication-readiness/**`|Publication/GA readiness|Final/go/no-go style claims|Issue #111-#115 and PR #109 state|PARTIAL/NO|Publication/GA cannot be inferred because PR #109 is not merged and tails remain deferred.|Mark current publication status as blocked/deferred in cleanup PR.|P1|
|`docs/design/**`|Design readiness / Liquid Glass|Design validation/readiness claims|Issue #113 final verdict|PARTIAL|Liquid Glass branches are not safe to merge; only tiny public visual slice is viable later.|Mark broad Liquid Glass readiness claims as evidence-only.|P2|
|`docs/security/**`|Security closure|Security header/customer finance/stakeholder smoke reports|Issue #114 and PR #109 evidence|PARTIAL|PR #109 report review/export blocker fixed, but middleware/security tails remain separate.|Create security docs index with latest issue #114 status.|P1|
|`docs/runbooks/**` and release smoke docs|Live/staging smoke readiness|Smoke runbooks and historical smoke proof|Issue #115 final verdict|PARTIAL|Live production smoke is not safe without explicit operator gate; staging is conditional.|Consolidate into operator-safe smoke policy after PR #109 merge.|P1|
|`docs/reconciliation/DRAFT_PR_SUMMARY_2026-06-20.md`|PR #109 readiness|Draft and not ready for main merge at that time|Later PR comments and issue #110|Superseded|Correct historically, but superseded by later green CI/final review; still PR remains blocked by non-author approval.|Leave as historical evidence; point index to latest PR comment/issue #110.|P2|
|`docs/reconciliation/PR_109_*` early runtime docs|PR #109 runtime status|Several NOT_RUN/BLOCKED/PASS snapshots|Later PR comments and final gate comments|Superseded/PARTIAL|Earlier runtime blockers were resolved later except GitHub review blocker remains.|Do not rewrite; create index mapping latest truth.|P2|
|Final pre-merge audit branch docs|Global merge verdict|PR #109 technically clean, deferred tails accepted|Remote audit branch and issue #111-#115|YES for audit scope|Current and high-signal, but not in PR #109 base branch.|Reference as latest global audit evidence after retarget/rebase.|P1|

## Current High-Risk Claim Classes

- "production ready"
- "GA"
- "final release"
- "AI live"
- "mobile ready"
- "Liquid Glass complete"
- "security complete"
- "smoke green"
- "legal/signoff complete"

These phrases must include date, environment, evidence link, and whether the claim is historical or current.

## Matrix Verdict

Stale readiness claims found: YES.

No single historical docs area should be treated as current truth without the latest PR/issue/audit context.
