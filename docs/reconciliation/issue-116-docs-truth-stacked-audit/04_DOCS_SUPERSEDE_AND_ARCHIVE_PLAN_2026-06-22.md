# Docs Supersede and Archive Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Keep as Evidence

Keep historical docs intact when they record:

- date-specific smoke results
- release attempts and blockers
- branch archaeology
- CI/build evidence
- runtime observations
- operator decisions
- incident/root-cause analysis

Do not rewrite these broadly. Add an index or supersession note instead.

## Mark Superseded Later

After PR #109 merges, create a docs cleanup PR to mark superseded:

- early PR #109 draft/runtime blocker docs that were later resolved
- old release go/no-go snapshots whose environment is no longer current
- AI/mobile/design readiness docs that predate issue #111-#115 audits
- docs that imply production readiness without current live evidence

## Consolidate

Recommended consolidated indexes:

- `docs/reconciliation/POST_BASELINE_TRUTH_INDEX.md`
- `docs/release/CURRENT_RELEASE_STATUS.md`
- `docs/ai/AI_CURRENT_STATUS.md`
- `docs/mobile-ios/MOBILE_CURRENT_STATUS.md`
- `docs/design/DESIGN_CURRENT_STATUS.md`
- `docs/security/SECURITY_CURRENT_STATUS.md`
- `docs/runbooks/LIVE_STAGING_SMOKE_POLICY.md`

These should link to historical evidence rather than deleting it.

## Do Not Trust Without Code / Runtime

Treat as evidence-only unless revalidated:

- "final production" docs
- "ready" docs
- "GA" docs
- "AI live" docs
- "mobile publication" docs
- "TestFlight" docs
- "Liquid Glass complete" docs
- "security closed" docs
- "smoke green" docs
- legal/signoff docs

## Archive Strategy

No deletion by default.

Preferred pattern:

1. Keep original files.
2. Add a current status index.
3. Add "superseded by" references in a small set of top-level status docs only.
4. Use issue links #111-#115 to explain deferred tails.
5. Avoid changing hundreds of historical files.

## Plan Verdict

Docs archive plan safe after PR #109 merge: YES, as a docs-only cleanup PR.
