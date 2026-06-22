# Safe Integration Plan — 2026-06-20

## Recommendation
- Recommended integration branch: `integration/aistroyka-full-reconciliation-2026-06-20`
- Base branch: `origin/main` unless production truth proves another base is required.
- Merge to main now: **NO**.

## Integration Order
1. Release/ops foundations.
2. Database/migrations/contracts.
3. Backend/API.
4. AI module.
5. Frontend/design/product surfaces.
6. Mobile.
7. Docs cleanup.

## Branches To Merge Completely
None are approved for direct complete merge from this audit. Candidate branches for possible full merge only after review:
- `chore/close-post-merge-tails`
- `feat/dashboard-v1-api-paths`
- `fix/ios-e2e-phantom-push`
- `fix/ios-e2e-workflow-push-phantom`
- `fix/ios-e2e-workflow-yaml`
- `fix/vercel-build-stabilization`
- `origin/claude/aistroyka-audit-security-infra-cg810i`
- `origin/cursor/critical-bug-investigation-c421`
- `origin/cursor/critical-correctness-bugs-20fe`
- `origin/cursor/critical-correctness-bugs-2263`
- `origin/cursor/critical-correctness-bugs-4030`
- `origin/cursor/critical-correctness-bugs-84c0`
- `origin/cursor/critical-correctness-bugs-85e3`
- `origin/cursor/critical-correctness-bugs-af15`
- `origin/cursor/discussion-status-silent-failure-c12b`
- `origin/cursor/technical-documentation-updates-569f`
- `origin/fix/ios-e2e-workflow-push-phantom`

## Branches To Cherry-Pick From
Select commits only after module-level comparison. Start from P1/P2 rows in `COMMITS_NOT_IN_MAIN_2026-06-20.md` that touch one isolated feature without migrations/auth changes.

## Branches Requiring Manual Review
- `ai/expert-review-queue-mvp`
- `ai/flywheel-final-tail-closure`
- `ai/gold-memory-mvp`
- `chore/ai-memory-layer-v1`
- `chore/enterprise-zero-trust`
- `chore/p2_1-server-chat-history`
- `chore/phase13-operator-refresh`
- `chore/resilience-hardening-v2`
- `chore/stabilization-p0`
- `chore/web-ai-p0-panel`
- `cursor-test`
- `design/liquid-glass-public-shell-lg2a`
- `docs/ios-e2e-ci-pass`
- `feat/p0-deps-and-security-headers`
- `feature/unified-product-design-certification`
- `fix/ios-e2e-ci-secrets`
- `fix/prod-ai-secrets-no-var-conflict`
- `fix/prod-ai-worker-secrets`
- `fix/prod-vision-model-gpt4o-mini`
- `hotfix/middleware-matcher-and-headers`
- `release/mobile-pilot-rc`
- `release/publication-readiness-mega-sprint`
- `release/web-pilot-rc`
- `origin/ai/expert-review-queue-mvp`
- `origin/ai/flywheel-final-tail-closure`
- `origin/ai/gold-memory-mvp`
- `origin/cursor/admin-expert-review-bugs-5228`
- `origin/cursor/aistroyka-system-maturity-7957`
- `origin/cursor/android-platform-launch-b8bb`
- `origin/cursor/auth-and-dashboard-issues-eb7c`
- `origin/cursor/critical-bug-investigation-7dfb`
- `origin/cursor/critical-correctness-bugs-7cfa`
- `origin/cursor/development-environment-setup-b598`
- `origin/cursor/development-environment-setup-ba4b`
- `origin/design/liquid-glass-public-shell-lg2a`
- `origin/fix/prod-ai-secrets-no-var-conflict`
- `origin/fix/prod-ai-worker-secrets`
- `origin/fix/prod-vision-model-gpt4o-mini`
- `origin/release/publication-readiness-mega-sprint`
- `origin/release/web-pilot-rc`

## Branches To Ignore / Archive After Confirmation
- `audit/full-project-git-archaeology-2026-06-20`
- `audit/release-readiness-max`
- `chore/actions-node24-readiness`
- `chore/actions-runtime-refresh`
- `chore/agents-md-continual-learning`
- `chore/deep-production-completion`
- `chore/enable-auth-hibp`
- `chore/next-after-pr12`
- `chore/production-closure-sprint`
- `chore/rename-workerlite-to-aistroykaworker`
- `develop`
- `docs/batch5-fk-count-fix`
- `docs/performance-advisors-update`
- `docs/pr13-release-closure`
- `docs/supabase-performance-advisors`
- `feat/manager-ai-parity-and-live-gates`
- `feat/multi-provider-auth-mainline`
- `feat/p1-design-tokens`
- `feat/p1-footer-tokens`
- `feat/platform-owner-cabinet`
- `feat/stage2-2-account-workspace`
- `fix/ai-vision-circuit-recovery`
- `fix/auth-hibp-project-ref`
- `fix/deploy-exact-ref-validation`
- `fix/deploy-ref-validation-clean`
- `fix/deploy-ref-validation-staging-main`
- `fix/drop-redundant-indexes-batch1`
- `fix/drop-redundant-indexes-batch2`
- `fix/drop-redundant-indexes-batch3`
- `fix/drop-redundant-indexes-batch4`
- `fix/drop-redundant-indexes-batch5`
- `fix/drop-redundant-indexes-batch6`
- `fix/drop-redundant-indexes-batch7`
- `fix/gdpr-workflow-main`
- `fix/pilot-smoke-prefer-user-jwt`
- `fix/prod-auth-stabilization`
- `fix/prod-dashboard-500-root-cause`
- `fix/project-defects-insert-policy-merge`
- `fix/rls-split-overlapping-all-policies`
- `fix/smoke-json-arm64`
- `fix/supabase-create-analysis-job-rpc-surface`
- `fix/supabase-offline-count-rpc-hardening`
- `fix/supabase-stakeholder-status-rpc-hardening`
- `hardening/dashboard-auth-middleware-sweep`
- `hotfix/deploy-workflow-yaml`
- `hotfix/restore-pages-and-cf-api-headers`
- `main`
- `mobile/worker-lite-finalization`
- `ops-com-redirect`
- `ops/c03-branch-protection-script`
- `ops/close-c03-evidence`
- `ops/external-setup-attempt`
- `ops/pilot-finalization`
- `ops/post-merge-closure-2026-06-15`
- `ops/post-merge-governance-checklist`
- `release/cloudflare-agent-starter-split`
- `release/phase5-2-1`
- `release/pilot-hardening-max`
- `release/pilot-launch-pack`
- `release/vercel-prod-hardening-2026-03-05`
- `test/stage2-3b-account-lifecycle`
- `origin`
- `origin/chore/actions-runtime-refresh`
- `origin/chore/agents-md-continual-learning`
- `origin/chore/deep-production-completion`
- `origin/chore/enable-auth-hibp`
- `origin/chore/next-after-pr12`
- `origin/cursor-test`
- `origin/develop`
- `origin/docs/batch5-fk-count-fix`
- `origin/docs/performance-advisors-update`
- `origin/docs/pr13-release-closure`
- `origin/docs/supabase-performance-advisors`
- `origin/feat/manager-ai-parity-and-live-gates`
- `origin/feat/platform-owner-cabinet`
- `origin/feat/stage2-2-account-workspace`
- `origin/fix/ai-vision-circuit-recovery`
- `origin/fix/auth-hibp-project-ref`
- `origin/fix/deploy-ref-validation-clean`
- `origin/fix/drop-redundant-indexes-batch1`

## Expected Conflicts
- App Router route collisions under `apps/web/app/[locale]`.
- API route/schema mismatches under `apps/web/app/api/v1`.
- Supabase migration ordering conflicts.
- AI flags/env/provider routing mismatches.
- iOS Xcode project file conflicts.
- Cloudflare/OpenNext and GitHub workflow drift.

## Validation Gates After Each Group
- Install: `bun install --frozen-lockfile`.
- i18n: `bun run i18n:check` when UI strings change.
- Lint: repo lint command from `package.json`.
- Typecheck/tests: focused tests for changed modules plus relevant package tests.
- Contracts build: root contracts build if contracts/API changed.
- Web build: `bun run build` only after integration chunks are stable.
- Cloudflare build: `bun run cf:build` after web build; do not run concurrently with Next build.
- Migration sanity: verify Supabase migration order and active project before applying anywhere.
- Frontend smoke: dashboard/public route smoke with auth roles.
- Pilot smoke: `bun run smoke:pilot:check` / pilot E2E when env is available.
- AI route smoke: `bash scripts/smoke/ai_live_provider.sh --require-live` before AI LIVE claims.

## Staging Deploy Verification Checklist
- Confirm target is canonical Cloudflare Workers deployment path.
- Confirm `NEXT_PUBLIC_*` build-time env values are present.
- Confirm auth/login and dashboard entry paths.
- Confirm tenant isolation and customer finance isolation.
- Confirm API v1 route compatibility for web and mobile clients.
- Confirm no internal cost/margin/profitability appears on customer/owner surfaces.

## Criteria For PR To Main
- Small integration PRs by module, not one unreviewable mega merge.
- Each PR has tests/smokes appropriate to its module.
- No secrets, keystores, env files, or generated artifacts committed.
- No production claims without live evidence.

## Rollback Strategy
- Merge via PR only.
- Keep each integration chunk revertable as a normal commit.
- Apply migrations only after backup/roll-forward plan and active project confirmation.
- Prefer disabled flags for newly integrated AI/frontend surfaces until smoke checks pass.
