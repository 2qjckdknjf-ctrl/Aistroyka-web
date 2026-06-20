# Git Archaeology Preflight — 2026-06-20

## Repository
- Original repository root: `/Users/alex/Projects/AISTROYKA`
- Audit worktree root: `/Users/alex/Projects/AISTROYKA-git-archaeology-2026-06-20`
- Original current branch before audit: `release/web-pilot-rc`
- Audit branch: `audit/full-project-git-archaeology-2026-06-20`
- Audit branch source: `origin/main`
- Latest `origin/main`: `ff537c8dec1d9dcdd7ef834894951e625aa97a87`

## Remotes
```text
origin	git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git (fetch)
origin	git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git (push)
```

## GitHub CLI
```text
UNAVAILABLE (exit 127): [Errno 86] Bad CPU type in executable: 'gh'
```

## Original Working Tree Status
```text
?? android/.secrets/
?? android/keystore.properties
?? docs/web/
```

## Dirty File Classification
|Status|Path|Classification|
|---|---|---|
|??|android/.secrets/|local config / secret (do not commit)|
|??|android/keystore.properties|local config / secret (do not commit)|
|??|docs/web/|docs|


## Local Branches
```text
ai/expert-review-queue-mvp
ai/flywheel-final-tail-closure
ai/gold-memory-mvp
+ audit/full-project-git-archaeology-2026-06-20
audit/release-readiness-max
+ chore/actions-node24-readiness
chore/actions-runtime-refresh
chore/agents-md-continual-learning
chore/ai-memory-layer-v1
chore/close-post-merge-tails
chore/deep-production-completion
chore/enable-auth-hibp
chore/enterprise-zero-trust
chore/next-after-pr12
chore/p2_1-server-chat-history
chore/phase13-operator-refresh
chore/production-closure-sprint
chore/rename-workerlite-to-aistroykaworker
chore/resilience-hardening-v2
chore/stabilization-p0
chore/web-ai-p0-panel
cursor-test
design/liquid-glass-public-shell-lg2a
develop
docs/batch5-fk-count-fix
docs/ios-e2e-ci-pass
docs/performance-advisors-update
docs/pr13-release-closure
docs/supabase-performance-advisors
feat/dashboard-v1-api-paths
feat/manager-ai-parity-and-live-gates
feat/multi-provider-auth-mainline
feat/p0-deps-and-security-headers
feat/p1-design-tokens
feat/p1-footer-tokens
feat/platform-owner-cabinet
feat/stage2-2-account-workspace
feature/unified-product-design-certification
fix/ai-vision-circuit-recovery
fix/auth-hibp-project-ref
fix/deploy-exact-ref-validation
fix/deploy-ref-validation-clean
fix/deploy-ref-validation-staging-main
fix/drop-redundant-indexes-batch1
+ fix/drop-redundant-indexes-batch2
fix/drop-redundant-indexes-batch3
fix/drop-redundant-indexes-batch4
fix/drop-redundant-indexes-batch5
fix/drop-redundant-indexes-batch6
fix/drop-redundant-indexes-batch7
fix/gdpr-workflow-main
fix/ios-e2e-ci-secrets
fix/ios-e2e-phantom-push
fix/ios-e2e-workflow-push-phantom
fix/ios-e2e-workflow-yaml
fix/pilot-smoke-prefer-user-jwt
fix/prod-ai-secrets-no-var-conflict
fix/prod-ai-worker-secrets
+ fix/prod-auth-stabilization
fix/prod-dashboard-500-root-cause
fix/prod-vision-model-gpt4o-mini
fix/project-defects-insert-policy-merge
fix/rls-split-overlapping-all-policies
fix/smoke-json-arm64
fix/supabase-create-analysis-job-rpc-surface
fix/supabase-offline-count-rpc-hardening
fix/supabase-stakeholder-status-rpc-hardening
fix/vercel-build-stabilization
hardening/dashboard-auth-middleware-sweep
hotfix/deploy-workflow-yaml
hotfix/middleware-matcher-and-headers
hotfix/restore-pages-and-cf-api-headers
+ main
mobile/worker-lite-finalization
ops-com-redirect
ops/c03-branch-protection-script
ops/close-c03-evidence
ops/external-setup-attempt
ops/pilot-finalization
ops/post-merge-closure-2026-06-15
ops/post-merge-governance-checklist
release/cloudflare-agent-starter-split
release/mobile-pilot-rc
release/phase5-2-1
release/pilot-hardening-max
release/pilot-launch-pack
release/publication-readiness-mega-sprint
release/vercel-prod-hardening-2026-03-05
release/web-pilot-rc
test/stage2-3b-account-lifecycle
```

## Remote Branches
```text
origin/HEAD -> origin/main
origin/ai/expert-review-queue-mvp
origin/ai/flywheel-final-tail-closure
origin/ai/gold-memory-mvp
origin/chore/actions-runtime-refresh
origin/chore/agents-md-continual-learning
origin/chore/deep-production-completion
origin/chore/enable-auth-hibp
origin/chore/next-after-pr12
origin/claude/aistroyka-audit-security-infra-cg810i
origin/cursor-test
origin/cursor/admin-expert-review-bugs-5228
origin/cursor/aistroyka-system-maturity-7957
origin/cursor/android-platform-launch-b8bb
origin/cursor/auth-and-dashboard-issues-eb7c
origin/cursor/critical-bug-investigation-7dfb
origin/cursor/critical-bug-investigation-c421
origin/cursor/critical-correctness-bugs-20fe
origin/cursor/critical-correctness-bugs-2263
origin/cursor/critical-correctness-bugs-4030
origin/cursor/critical-correctness-bugs-7cfa
origin/cursor/critical-correctness-bugs-84c0
origin/cursor/critical-correctness-bugs-85e3
origin/cursor/critical-correctness-bugs-af15
origin/cursor/development-environment-setup-b598
origin/cursor/development-environment-setup-ba4b
origin/cursor/discussion-status-silent-failure-c12b
origin/cursor/technical-documentation-updates-569f
origin/design/liquid-glass-public-shell-lg2a
origin/develop
origin/docs/batch5-fk-count-fix
origin/docs/performance-advisors-update
origin/docs/pr13-release-closure
origin/docs/supabase-performance-advisors
origin/feat/manager-ai-parity-and-live-gates
origin/feat/platform-owner-cabinet
origin/feat/stage2-2-account-workspace
origin/fix/ai-vision-circuit-recovery
origin/fix/auth-hibp-project-ref
origin/fix/deploy-ref-validation-clean
origin/fix/drop-redundant-indexes-batch1
origin/fix/drop-redundant-indexes-batch2
origin/fix/drop-redundant-indexes-batch3
origin/fix/drop-redundant-indexes-batch4
origin/fix/drop-redundant-indexes-batch5
origin/fix/drop-redundant-indexes-batch6
origin/fix/drop-redundant-indexes-batch7
origin/fix/ios-e2e-workflow-push-phantom
origin/fix/pilot-smoke-prefer-user-jwt
origin/fix/prod-ai-secrets-no-var-conflict
origin/fix/prod-ai-worker-secrets
origin/fix/prod-vision-model-gpt4o-mini
origin/fix/project-defects-insert-policy-merge
origin/fix/rls-split-overlapping-all-policies
origin/fix/smoke-json-arm64
origin/fix/supabase-create-analysis-job-rpc-surface
origin/fix/supabase-offline-count-rpc-hardening
origin/fix/supabase-stakeholder-status-rpc-hardening
origin/hotfix/deploy-workflow-yaml
origin/main
origin/ops/c03-branch-protection-script
origin/ops/close-c03-evidence
origin/ops/external-setup-attempt
origin/ops/post-merge-closure-2026-06-15
origin/ops/post-merge-governance-checklist
origin/release/cloudflare-agent-starter-split
origin/release/phase5-2-1
origin/release/publication-readiness-mega-sprint
origin/release/vercel-prod-hardening-2026-03-05
origin/release/web-pilot-rc
origin/snapshots/2026-03-15
origin/snapshots/2026-03-16
origin/snapshots/2026-03-17
origin/snapshots/2026-03-18
origin/snapshots/2026-03-19
origin/snapshots/2026-03-20
origin/snapshots/2026-03-21
origin/snapshots/2026-03-22
origin/snapshots/2026-03-23
origin/snapshots/2026-03-24
origin/snapshots/2026-03-25
origin/snapshots/2026-03-26
origin/snapshots/2026-03-27
origin/snapshots/2026-03-28
origin/snapshots/2026-03-29
origin/snapshots/2026-03-30
origin/snapshots/2026-03-31
origin/snapshots/2026-04-01
origin/snapshots/2026-04-02
origin/snapshots/2026-04-03
origin/snapshots/2026-04-04
origin/snapshots/2026-04-05
origin/snapshots/2026-04-06
origin/snapshots/2026-04-07
origin/snapshots/2026-04-08
origin/snapshots/2026-04-09
origin/snapshots/2026-04-10
origin/snapshots/2026-04-11
origin/snapshots/2026-04-12
origin/snapshots/2026-04-13
origin/snapshots/2026-04-14
origin/snapshots/2026-04-15
origin/snapshots/2026-04-16
origin/snapshots/2026-04-17
origin/snapshots/2026-04-18
origin/snapshots/2026-04-19
```

## Tags
```text
phase5-2-1-ready-20260306-0850
phase5-2-1-ready-20260306-0911
```

## Last 10 Commits On Original Checkout
```text
9d6a7812 (HEAD -> release/web-pilot-rc, origin/release/web-pilot-rc) design: apply Liquid Glass across web app surfaces
3331db77 design: complete solutions redesign and public site certification fixes
2110f674 design: redesign workflows page
0f185198 design: close LG-4.5 API, LG-4.5.1 integrity, and LG-4.6 workflows audit
7d2c8c57 design: close LG-4X public site polish and zero-tail audit
b5a67ea9 design: harden public site architecture before LG-4X
6e0b848b design: redesign security and implementation public pages
1fc996ab design: redesign integrations public page
3d50a8f9 design: redesign pricing and enterprise public pages
7a70f85b design: redesign features page
```

## Audit Worktree Status After Branch Creation
- Branch: `audit/full-project-git-archaeology-2026-06-20`

```text
clean
```

## Safety Verdict
- Safe to continue read-only analysis: **YES**.
- Reason: the original checkout is dirty, so the requested audit branch was created in a separate worktree instead of checking out over local work.
- Warnings: `gh` is installed but not executable on this machine, so PR/deleted branch reconstruction is partial.
- Secret warning: Android keystore material/config is untracked in the original checkout and must not be committed.
