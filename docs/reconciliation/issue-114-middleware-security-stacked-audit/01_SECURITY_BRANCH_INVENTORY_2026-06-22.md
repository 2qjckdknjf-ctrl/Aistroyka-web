# Security / Middleware Branch Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Branch Inventory

|Branch|SHA|Ahead / behind PR #109|Files|Middleware|Headers/config|Auth/RBAC|API/domain|Tests|Docs|Classification|Direct merge|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
|`hotfix/middleware-matcher-and-headers`|`0150f0be79fc`|1 / 35|4|1|1|0|0|0|1|Relevant small header/matcher reference.|NO|
|`feat/p0-deps-and-security-headers`|`8c0905ab2f1e`|1 / 36|19|1|6|0|1|2|4|Relevant but mixed with package/lockfile/tooling changes.|NO|
|`chore/phase13-operator-refresh`|`72ef0222afd9`|1 / 42|8|0|0|1|1|0|5|Governance/auth docs reference only.|NO|
|`origin/cursor/auth-and-dashboard-issues-eb7c`|`9f738640d08f`|1 / 144|4|0|0|2|2|1|0|Auth callback/dashboard support branch with migration.|NO|
|`origin/cursor/aistroyka-system-maturity-7957`|`63d9f26ff990`|17 / 577|78|0|0|9|47|0|26|Very broad old system/auth/API branch.|NO|
|`origin/claude/aistroyka-audit-security-infra-cg810i`|`193e9b80d229`|1 / 68|6|0|0|0|2|2|1|Focused sync-security reference.|NO|

## Superseded / Contained Branches

These have no diff against PR #109 for this audit or are too stale to drive work:

- `chore/enable-auth-hibp`
- `fix/auth-hibp-project-ref`
- `fix/prod-auth-stabilization`
- `hardening/dashboard-auth-middleware-sweep`
- `hotfix/deploy-workflow-yaml`
- `hotfix/restore-pages-and-cf-api-headers`
- `feat/multi-provider-auth-mainline`

## Stale / Unrelated History

- `chore/stabilization-p0`
- `chore/web-ai-p0-panel`

These have no merge base with PR #109 and are unsafe to compare or merge directly.

## Inventory Verdict

Broad middleware/security merge safe now: NO.

Useful follow-up ideas exist, especially around API security header coverage under OpenNext/Cloudflare, but they must be isolated into one small tested PR after PR #109 merges.
