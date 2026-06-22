# Docs Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Counts

Repository docs under `docs/` at this base:

- total tracked docs paths: 1911
- markdown docs: 1881

This volume means historical readiness language must be indexed and superseded carefully rather than rewritten broadly.

## Major Docs Areas Reviewed

|Area|Examples|Current status classification|
|---|---|---|
|Reconciliation docs|`docs/reconciliation/**`|Highest-signal current evidence for PR #109 scope. Some earlier PR-gate docs are superseded by later PR comments and final gate comments.|
|Final pre-merge audit docs|remote branch `origin/audit/final-global-premerge-audit-2026-06-21`|Current global audit evidence, but not in PR #109 branch.|
|Issue #111-#115 audit docs|remote stacked audit branches|Current tail-specific evidence. Must be retargeted/rebased after PR #109 merge before merging to main.|
|Release docs|`docs/release/**`, `docs/release1/**`, `docs/release-audit/**`, `docs/release-hardening/**`|Mixed historical evidence; many readiness/go/no-go claims require date/environment context.|
|AI docs|`docs/ai/**`, `docs/ai-flywheel/**`, publication readiness AI docs|Evidence only. Issue #111 says broad AI/Flywheel merge, migrations, and flags are not safe now.|
|Mobile docs|`docs/mobile-ios/**`, `docs/mobile/**`, `docs/worker-lite/**`|Evidence only. Issue #112 says iOS/Android pilot release is not safe now; iOS is strongest but still needs post-baseline runtime/TestFlight evidence.|
|Design docs|`docs/design/**`, design/release docs, reconciliation frontend docs|Evidence only. Issue #113 says broad Liquid Glass/design merge is not safe.|
|Security docs|`docs/security/**`, security/release docs|Mixed. Issue #114 says broad middleware/security merge is not safe; next safe slice is API header coverage verification.|
|Ops/smoke docs|`docs/runbooks/**`, release smoke docs|Mixed. Issue #115 says live production smoke is not safe without explicit operator gate.|
|Legal/signoff docs|`docs/release/**`, `docs/publication-readiness/**`, legal/privacy docs if present|Evidence only unless signed and current; do not infer legal/GA readiness from old checklist files.|

## Current Source-of-Truth Hierarchy

1. Current code on PR #109 HEAD and protected branch status.
2. Current PR #109 GitHub comments/checks.
3. Issue #110 required-review blocker.
4. Issue #111-#115 stacked audit verdicts.
5. Final pre-merge audit branch docs.
6. Historical release/product docs as supporting evidence only.

## Inventory Verdict

Docs cleanup is needed after PR #109 baseline merge, but broad historical rewrites before merge are not safe.
