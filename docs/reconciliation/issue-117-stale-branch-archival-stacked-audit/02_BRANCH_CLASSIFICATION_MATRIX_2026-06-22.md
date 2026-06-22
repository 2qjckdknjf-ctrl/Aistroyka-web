# Branch Classification Matrix

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

This matrix records representative branches and cleanup rules. It is not approval to delete anything.

|Branch|Latest SHA|Last activity|Contained in main|Contained in PR #109|Ahead of PR #109|Category|Risk|Recommendation|
|---|---:|---|---|---|---:|---|---|---|
|`origin/main`|`ff537c8d`|2026-06-20|YES|YES|0|KEEP_ACTIVE|Low|Keep.|
|`origin/integration/aistroyka-full-reconciliation-2026-06-20`|`bc23c832`|2026-06-21|NO|YES|0|KEEP_ACTIVE|Low|Keep until PR #109 merges.|
|`origin/audit/final-global-premerge-audit-2026-06-21`|`b696f80d`|2026-06-21|NO|NO|2|KEEP_STACKED_AUDIT|Low|Retain as audit evidence.|
|`origin/audit/issue-111-ai-flywheel-stacked-audit-2026-06-21`|`a0a93c48`|2026-06-21|NO|NO|1|KEEP_STACKED_AUDIT|Low|Retarget/rebase after PR #109 merge.|
|`origin/audit/issue-112-mobile-pilot-stacked-audit-2026-06-22`|`f9706afa`|2026-06-22|NO|NO|1|KEEP_STACKED_AUDIT|Low|Retarget/rebase after PR #109 merge.|
|`origin/audit/issue-113-design-public-stacked-audit-2026-06-22`|`4ade443a`|2026-06-22|NO|NO|1|KEEP_STACKED_AUDIT|Low|Retarget/rebase after PR #109 merge.|
|`origin/audit/issue-114-middleware-security-stacked-audit-2026-06-22`|`32d6fe7a`|2026-06-22|NO|NO|1|KEEP_STACKED_AUDIT|Low|Retarget/rebase after PR #109 merge.|
|`origin/audit/issue-115-live-staging-smoke-stacked-audit-2026-06-22`|`585c83e7`|2026-06-22|NO|NO|1|KEEP_STACKED_AUDIT|Low|Retarget/rebase after PR #109 merge.|
|`origin/audit/issue-116-docs-truth-stacked-audit-2026-06-22`|`5567350b`|2026-06-22|NO|NO|1|KEEP_STACKED_AUDIT|Low|Retarget/rebase after PR #109 merge.|
|`origin/ai/flywheel-final-tail-closure`|`20b4f3f7`|2026-06-17|NO|NO|2|KEEP_DEFERRED_TAIL|High|Defer to issue #111.|
|`origin/ai/expert-review-queue-mvp`|`498b6743`|2026-06-17|NO|NO|12|KEEP_DEFERRED_TAIL|High|Defer to issue #111 / open PR #106.|
|`origin/ai/gold-memory-mvp`|`98a068c1`|2026-06-19|NO|NO|39|KEEP_DEFERRED_TAIL|High|Defer to issue #111 / open PR #104.|
|`origin/design/liquid-glass-public-shell-lg2a`|`68be705a`|2026-06-19|NO|NO|38|KEEP_DEFERRED_TAIL|High|Defer to issue #113 / open PR #108.|
|`origin/cursor/android-platform-launch-b8bb`|`1ae0b23d`|2026-03-07|NO|NO|4|KEEP_DEFERRED_TAIL|High|Defer to issue #112; old closed PR #4 exists.|
|`origin/cursor/aistroyka-system-maturity-7957`|`63d9f26f`|2026-03-07|NO|NO|17|KEEP_DEFERRED_TAIL|High|Defer to issue #114; old closed PR #3 exists.|
|`origin/release/web-pilot-rc`|`9d6a7812`|2026-06-20|NO|NO|23|STALE_REVIEW_REQUIRED|Medium|Manual review before archive; design reference.|
|`origin/release/publication-readiness-mega-sprint`|`c6617419`|2026-06-04|NO|NO|26|STALE_REVIEW_REQUIRED|Medium|Manual review before archive; release evidence branch.|
|`origin/cursor/critical-bug-investigation-66e8`|`d0ed7258`|2026-06-21|NO|NO|2|STALE_REVIEW_REQUIRED|Medium|Open PR #119; do not archive.|
|`origin/snapshots/2026-03-15`|`3d88f1ba`|2026-03-15|YES|YES|0|MERGED_OR_CONTAINED|Low|Archive candidate after PR #109 merge and operator approval.|
|`origin/develop`|`e509f537`|2026-04-27|YES|YES|0|MERGED_OR_CONTAINED|Low|Archive candidate after operator approval if no active process uses it.|

## Category Definitions

- `KEEP_ACTIVE`: active branch, do not archive.
- `KEEP_STACKED_AUDIT`: issue/audit branches created to preserve evidence; retarget/rebase after PR #109 merge.
- `KEEP_DEFERRED_TAIL`: branch contains deferred product/security/mobile/design/AI work; keep until issue-driven decision.
- `MERGED_OR_CONTAINED`: branch is already contained in `main` and PR #109; candidate for archive after approval.
- `SUPERSEDED_BY_PR109`: branch has no unique diff beyond PR #109; candidate only after PR #109 merges.
- `STALE_REVIEW_REQUIRED`: branch has unique commits but no current safe merge path; manual review before archive.
- `DANGEROUS_DO_NOT_MERGE`: branch is broad, old, or mixes unsafe domains; never merge wholesale.
- `UNKNOWN_MANUAL_REVIEW`: not enough evidence; review manually.

## Matrix Verdict

The cleanup plan should start with contained/snapshot branches only after PR #109 merges. Deferred-tail and open-PR branches must be retained.
