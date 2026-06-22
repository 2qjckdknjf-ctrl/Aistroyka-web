# Safe Docs Cleanup Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Docs PR

After PR #109 merges and `main` validation passes, the safest docs cleanup is:

**Create a current truth index and top-level status docs, without rewriting historical evidence.**

## Proposed Scope

Expected files:

- `docs/reconciliation/POST_BASELINE_TRUTH_INDEX.md`
- optional current status indexes for release, AI, mobile, design, security, and smoke policy
- small updates to existing docs indexes only

Avoid:

- deleting historical docs
- rewriting hundreds of old files
- editing legal/signoff docs without owner input
- claiming production/GA/mobile/AI/design readiness

## Wording Rules

Use:

- "evidence from DATE"
- "current as of COMMIT"
- "blocked by issue #..."
- "deferred to separate PR"
- "not production-ready"
- "partial"
- "operator approval required"

Avoid:

- "done" without evidence
- "ready" without environment/runtime proof
- "final" without current signoff
- "live AI" without non-fallback live-provider proof
- "mobile ready" without TestFlight/device evidence
- "production ready" while PR #109 is unmerged or release gates remain open

## Required References

Post-baseline docs cleanup must reference:

- PR #109
- issue #110 required review blocker if still open
- issue #111 AI/Flywheel audit
- issue #112 Mobile audit
- issue #113 Design/public audit
- issue #114 Middleware/security audit
- issue #115 Live/staging smoke policy audit
- customer-finance isolation roadmap rule

## Deferred

Remain deferred:

- legal signoff correction
- publication readiness correction
- mobile app store docs correction
- live/staging smoke evidence update
- AI/Flywheel docs activation
- Liquid Glass implementation docs

## Validation

Docs-only cleanup should still run:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bun run build:contracts`
- `bun run i18n:check`
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`

## Slice Verdict

Next safe docs slice: current truth index after PR #109 merge.

Safe before PR #109 merges: NO.
