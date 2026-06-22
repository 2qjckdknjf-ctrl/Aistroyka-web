# Dangerous and Deferred Branches

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## AI / Flywheel Branches

Retain and do not broad-merge:

- `origin/ai/flywheel-final-tail-closure`
- `origin/ai/expert-review-queue-mvp`
- `origin/ai/gold-memory-mvp`
- `origin/cursor/admin-expert-review-bugs-5228`

Reason: issue #111 found broad AI/Flywheel merge unsafe. Migrations, RLS, service-role routes, Gold Memory, Expert Review Queue, and flags require separate audit/implementation slices.

## Mobile Branches

Retain and do not broad-merge:

- `origin/cursor/android-platform-launch-b8bb`
- `release/mobile-pilot-rc` local branch
- mobile/pilot-related historical branches with unique commits

Reason: issue #112 found broad mobile merge unsafe. iOS needs post-baseline validation; Android needs separate build/runtime path.

## Design / Public Branches

Retain and do not broad-merge:

- `origin/design/liquid-glass-public-shell-lg2a`
- `feature/unified-product-design-certification` local branch
- `origin/release/web-pilot-rc`

Reason: issue #113 found broad Liquid Glass/design merge unsafe. Branches mix UI, routing, AI, mobile, and API concerns.

## Middleware / Security Branches

Retain and do not broad-merge:

- `origin/cursor/aistroyka-system-maturity-7957`
- `origin/cursor/auth-and-dashboard-issues-eb7c`
- `origin/claude/aistroyka-audit-security-infra-cg810i`
- security/middleware/header local references where unique

Reason: issue #114 found broad middleware/security merge unsafe. Future work must be route/header scoped with focused tests.

## Release / Smoke / Docs Branches

Review before archive:

- `origin/release/publication-readiness-mega-sprint`
- `origin/release/web-pilot-rc`
- older release branches not contained in PR #109

Reason: may contain historical evidence, but issue #115 and issue #116 say current truth must come from latest PR/issue/audit state.

## Open PR Branches

Must retain:

- PR #119 head: `cursor/critical-bug-investigation-66e8`
- PR #109 head: `integration/aistroyka-full-reconciliation-2026-06-20`
- PR #108 head: `design/liquid-glass-public-shell-lg2a`
- PR #106 head: `ai/expert-review-queue-mvp`
- PR #104 head: `ai/gold-memory-mvp`
- PR #103 head: `ai/flywheel-final-tail-closure`

## Broad Merge Rule

Do not broad-merge any branch listed here. Future work must start from merged `main` after PR #109 and use the issue-specific safe slice plans.
