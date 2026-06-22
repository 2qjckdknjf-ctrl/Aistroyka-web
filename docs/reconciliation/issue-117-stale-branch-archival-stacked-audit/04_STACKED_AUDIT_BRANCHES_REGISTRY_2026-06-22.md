# Stacked Audit Branches Registry

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Registry

|Issue|Branch|Commit|Purpose|Rule after PR #109 merge|
|---:|---|---:|---|---|
|#111|`origin/audit/issue-111-ai-flywheel-stacked-audit-2026-06-21`|`a0a93c48`|AI/Flywheel DB, RLS, runtime audit.|Retarget/rebase before any merge.|
|#112|`origin/audit/issue-112-mobile-pilot-stacked-audit-2026-06-22`|`f9706afa`|Mobile pilot API/build/runtime audit.|Retarget/rebase before any merge.|
|#113|`origin/audit/issue-113-design-public-stacked-audit-2026-06-22`|`4ade443a`|Liquid Glass/public design audit.|Retarget/rebase before any merge.|
|#114|`origin/audit/issue-114-middleware-security-stacked-audit-2026-06-22`|`32d6fe7a`|Middleware/security follow-up audit.|Retarget/rebase before any merge.|
|#115|`origin/audit/issue-115-live-staging-smoke-stacked-audit-2026-06-22`|`585c83e7`|Live/staging smoke policy audit.|Retarget/rebase before any merge.|
|#116|`origin/audit/issue-116-docs-truth-stacked-audit-2026-06-22`|`5567350b`|Docs truth/stale readiness audit.|Retarget/rebase before any merge.|
|#117|`audit/issue-117-stale-branch-archival-stacked-audit-2026-06-22`|TBD|Stale branch archival audit.|Retarget/rebase before any merge.|

## Shared Basis

All issue #111-#117 branches are stacked from PR #109 HEAD, not from merged `main`.

## Retarget / Rebase Rule

After PR #109 merges:

1. Fetch updated `main`.
2. Confirm PR #109 head is contained in `main`.
3. Rebase or recreate each audit branch onto updated `main`.
4. Open/retarget only audit PRs that remain useful.
5. Do not merge stacked audit branches directly into `main` before retargeting.

## Registry Verdict

Stacked audit branches must be retained until PR #109 is resolved and their issues are either converted into clean post-baseline PRs or explicitly archived by operator decision.
