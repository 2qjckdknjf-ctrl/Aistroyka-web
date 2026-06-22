# Branch Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

No branches were deleted, merged, renamed, retargeted, or force-pushed during this audit.

## Counts

|Item|Count|
|---|---:|
|Local branches|99|
|Remote origin branches|115|
|Tags|2|
|Open PRs|6|
|PRs sampled via GitHub CLI|110|

## Tags

- `phase5-2-1-ready-20260306-0850`
- `phase5-2-1-ready-20260306-0911`

## Open PR Relationship Snapshot

|PR|State|Base|Head|Meaning|
|---:|---|---|---|---|
|#119|OPEN|`main`|`cursor/critical-bug-investigation-66e8`|Independent invite provisioning fix; do not conflate with PR #109.|
|#109|OPEN|`main`|`integration/aistroyka-full-reconciliation-2026-06-20`|Reconciliation baseline; green, blocked by non-author review.|
|#108|OPEN|`main`|`design/liquid-glass-public-shell-lg2a`|Design/Liquid Glass branch; issue #113 says broad merge unsafe.|
|#106|OPEN|`main`|`ai/expert-review-queue-mvp`|AI Expert Review Queue; issue #111 says broad AI merge unsafe.|
|#104|OPEN|`main`|`ai/gold-memory-mvp`|Gold Memory; issue #111 says broad AI merge unsafe.|
|#103|OPEN|`main`|`ai/flywheel-final-tail-closure`|AI Flywheel tail; issue #111 says broad AI merge unsafe.|

## Classification Counts

|Category|Count|
|---|---:|
|KEEP_ACTIVE|1|
|KEEP_STACKED_AUDIT|7|
|KEEP_DEFERRED_TAIL|9|
|MERGED_OR_CONTAINED|78|
|STALE_REVIEW_REQUIRED|20|

## Inventory Verdict

The repo has enough branch residue that cleanup is valuable, but PR #109 must merge first. Most branches are contained and likely archive candidates, but deferred-tail and open-PR branches must be retained.
