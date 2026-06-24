# Branch Classification — 2026-06-23

**Baseline `main`:** `d7a0547c3b571d572434466a470dce8b180d6537`

Classification is **heuristic + manual review**. No ref mutations performed.

## Summary

| Class | Count |
|---|---:|
| KEEP ACTIVE | 9 |
| ARCHIVE CANDIDATE SAFE AFTER CONFIRMATION | 20 |
| DO NOT MERGE DANGEROUS | 10 |
| NEEDS MANUAL REVIEW | 77 |
| DELETE NEVER WITHOUT BACKUP | 8 |

### KEEP ACTIVE (9)

| Branch | Last SHA | Last commit | vs `main` | Reason (subject) | Recommended action |
|---|---|---|---|---|---|
| `main` | `d7a0547c` | 2026-06-23 | merged | Merge pull request #128 from 2qjckdknjf-ctrl/docs/issue-116-current-trut | Keep active; do not delete without explicit operator decision |
| `docs/issue-116-current-truth-index-2026-06-23` | `7a2b0c7c` | 2026-06-23 | merged | docs: add current project truth index | Keep active; do not delete without explicit operator decision |
| `polish/issue-118-reports-export-ui-2026-06-23` | `6cca074f` | 2026-06-23 | merged | polish: improve reports export UI feedback | Keep active; do not delete without explicit operator decision |
| `fix/diagnostics-route-env-sensitive-mock-2026-06-23` | `bbaccd43` | 2026-06-23 | merged | test: stabilize diagnostics route config mock | Keep active; do not delete without explicit operator decision |
| `cursor/critical-bug-investigation-66e8` | `d0ed7258` | 2026-06-21 | not merged | fix: narrow invite sync target type | Keep active; do not delete without explicit operator decision |
| `ai/gold-memory-mvp` | `98a068c1` | 2026-06-19 | not merged | Design: complete Liquid Glass public site redesign (#107) | Keep active; do not delete without explicit operator decision |
| `design/liquid-glass-public-shell-lg2a` | `68be705a` | 2026-06-19 | not merged | docs: add final LG branch readiness report | Keep active; do not delete without explicit operator decision |
| `ai/expert-review-queue-mvp` | `498b6743` | 2026-06-17 | not merged | docs(ai-flywheel): record PR #105 reconciliation into ai/gold-memory-mvp | Keep active; do not delete without explicit operator decision |
| `ai/flywheel-final-tail-closure` | `20b4f3f7` | 2026-06-17 | not merged | docs(ai-flywheel): record CI cf:build proof on closure SHA | Keep active; do not delete without explicit operator decision |

### ARCHIVE CANDIDATE SAFE AFTER CONFIRMATION (20)

| Branch | Last SHA | Last commit | vs `main` | Reason (subject) | Recommended action |
|---|---|---|---|---|---|
| `audit/issue-110-github-governance-forensic-2026-06-23` | `1f649114` | 2026-06-23 | merged | docs: audit github governance bypass issue | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `docs/issue-115-live-staging-smoke-runbook-2026-06-22` | `4199e204` | 2026-06-22 | merged | docs: add live staging smoke runbook | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/issue-114-api-security-header-coverage-2026-06-22` | `b1b17bd9` | 2026-06-22 | merged | fix: verify API security header coverage | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `audit/issue-116-docs-truth-stacked-audit-2026-06-22` | `b47a9120` | 2026-06-22 | merged | docs: audit docs truth stacked post-baseline scope | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/smoke-json-arm64` | `b9946ee0` | 2026-06-16 | merged | fix(smoke): portable JSON parsing on Apple Silicon hosts | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/ai-vision-circuit-recovery` | `bd2b6a4f` | 2026-06-02 | merged | fix(ai): recover vision providers from stuck circuit breakers. | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch7` | `bc58499b` | 2026-06-02 | merged | Drop final low-traffic fkfix indexes (batch 7). | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch6` | `b15ae9a7` | 2026-06-02 | merged | Drop redundant actor fkfix indexes on entity tables (batch 6). | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `docs/batch5-fk-count-fix` | `6839b3b3` | 2026-06-02 | merged | docs(audit): correct batch 5 unindexed_foreign_keys count to 65. | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch5` | `bbccef04` | 2026-06-02 | merged | Drop redundant fkfix indexes on commercial/AI entity tables (batch 5). | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch4` | `2f4d7d94` | 2026-06-02 | merged | Drop redundant fkfix indexes on client requests and documents (batch 4). | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch3` | `70ebbb34` | 2026-06-02 | merged | Drop redundant fkfix indexes on defects and change orders (batch 3). | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch2` | `f3b27227` | 2026-05-29 | merged | Drop redundant audit/event fkfix indexes (batch 2). | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `docs/performance-advisors-update` | `50524a3e` | 2026-05-29 | merged | Update performance advisor audit after batch 1 and Auth DB percent. | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/drop-redundant-indexes-batch1` | `b5e6bde2` | 2026-05-29 | merged | Drop 23 redundant indexes and add Auth DB pool percent workflow. | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/project-defects-insert-policy-merge` | `8e14519e` | 2026-05-29 | merged | Merge project_defects INSERT RLS policies to clear remaining advisor war | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/rls-split-overlapping-all-policies` | `6c425b9b` | 2026-05-29 | merged | Split overlapping FOR ALL RLS policies for advisor performance. | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/auth-hibp-project-ref` | `59f8dea3` | 2026-05-29 | merged | Fix HIBP enable script to use canonical AISTROYKA project ref. | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `docs/pr13-release-closure` | `e5500630` | 2026-05-20 | merged | fix(manager): localize AI pipeline status labels | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |
| `fix/pilot-smoke-prefer-user-jwt` | `b4166233` | 2026-04-19 | merged | fix(smoke): prefer password-grant JWT for pilot ops/metrics | Archive/delete candidate only after owner confirmation, backup/export, and separate operator task |

### DO NOT MERGE DANGEROUS (10)

| Branch | Last SHA | Last commit | vs `main` | Reason (subject) | Recommended action |
|---|---|---|---|---|---|
| `audit/issue-112-mobile-pilot-stacked-audit-2026-06-22` | `1a862c8f` | 2026-06-22 | not merged | docs: audit mobile pilot stacked post-baseline scope | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `audit/issue-114-middleware-security-stacked-audit-2026-06-22` | `4475dcd1` | 2026-06-22 | not merged | docs: audit middleware security stacked post-baseline scope | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `audit/issue-111-ai-flywheel-stacked-audit-2026-06-21` | `d810465b` | 2026-06-22 | not merged | docs: audit AI flywheel stacked post-baseline scope | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `integration/aistroyka-full-reconciliation-2026-06-20` | `bc23c832` | 2026-06-21 | merged | fix: harden report review authorization | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `release/web-pilot-rc` | `9d6a7812` | 2026-06-20 | not merged | design: apply Liquid Glass across web app surfaces | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `release/publication-readiness-mega-sprint` | `c6617419` | 2026-06-04 | not merged | fix(web): typecheck contact routes via shared insertContactLead helper | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `release/cloudflare-agent-starter-split` | `17547e66` | 2026-05-20 | merged | stage-final(preflight): document pre-merge branch state | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `release/phase5-2-1` | `2ad42578` | 2026-03-07 | merged | docs(prod): final smoke green proof + smoke auth/runbook | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `cursor/aistroyka-system-maturity-7957` | `63d9f26f` | 2026-03-07 | not merged | architecture: final certification - normalization complete | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |
| `release/vercel-prod-hardening-2026-03-05` | `667212dd` | 2026-03-06 | merged | docs(ops): add lockfile frozen / cache notes to final report | Do not broad-merge; requires fresh rebase + small-slice audit if ever revived |

### NEEDS MANUAL REVIEW (77)

| Branch | Last SHA | Last commit | vs `main` | Reason (subject) | Recommended action |
|---|---|---|---|---|---|
| `origin` | `d7a0547c` | 2026-06-23 | unknown | Merge pull request #128 from 2qjckdknjf-ctrl/docs/issue-116-current-trut | Manual triage required before merge, archive, or delete |
| `audit/issue-113-design-public-stacked-audit-2026-06-22` | `6ece0d5d` | 2026-06-22 | not merged | docs: audit design public stacked post-baseline scope | Manual triage required before merge, archive, or delete |
| `audit/issue-115-live-staging-smoke-stacked-audit-2026-06-22` | `66f63c24` | 2026-06-22 | not merged | docs: audit live staging smoke stacked post-baseline scope | Manual triage required before merge, archive, or delete |
| `audit/issue-117-stale-branch-archival-stacked-audit-2026-06-22` | `ae10f5f4` | 2026-06-22 | not merged | docs: audit stale branch archival stacked post-baseline scope | Manual triage required before merge, archive, or delete |
| `audit/issue-118-reports-export-ui-polish-stacked-audit-2026-06-22` | `fb3bb620` | 2026-06-22 | not merged | docs: audit reports export UI polish stacked post-baseline scope | Manual triage required before merge, archive, or delete |
| `audit/final-global-premerge-audit-2026-06-21` | `b696f80d` | 2026-06-21 | not merged | docs: add post-baseline tail plan | Manual triage required before merge, archive, or delete |
| `feat/stage2-2-account-workspace` | `cb90eae1` | 2026-06-20 | merged | feat: wire account workspace creation for tenant signup | Manual triage required before merge, archive, or delete |
| `cursor/admin-expert-review-bugs-5228` | `8590459e` | 2026-06-19 | not merged | Fix expert review queue selection state | Manual triage required before merge, archive, or delete |
| `fix/ios-e2e-workflow-push-phantom` | `773ba8e2` | 2026-06-17 | not merged | docs(ios): centralize Layer B CI operator notes | Manual triage required before merge, archive, or delete |
| `ops/close-c03-evidence` | `21a96a20` | 2026-06-16 | merged | docs(audit): close C-03 after main branch protection applied | Manual triage required before merge, archive, or delete |
| `ops/c03-branch-protection-script` | `805f010a` | 2026-06-16 | merged | docs: record iOS Layer B live E2E PASS (2026-06-16) | Manual triage required before merge, archive, or delete |
| `ops/post-merge-governance-checklist` | `dde43387` | 2026-06-15 | merged | docs(ops): add post-merge governance checklist for C-03 closure | Manual triage required before merge, archive, or delete |
| `ops/post-merge-closure-2026-06-15` | `00a442df` | 2026-06-15 | merged | docs: record post-merge prod cd130eb closure and AGENTS.md learnings | Manual triage required before merge, archive, or delete |
| `feat/manager-ai-parity-and-live-gates` | `43d3737d` | 2026-06-12 | merged | fix(ios): resolve duplicate MGR038 pbxproj id for ManagerSemanticColors | Manual triage required before merge, archive, or delete |
| `fix/prod-vision-model-gpt4o-mini` | `fc430c21` | 2026-06-02 | not merged | fix(prod): set OPENAI_VISION_MODEL to gpt-4o-mini on production Worker | Manual triage required before merge, archive, or delete |
| `fix/prod-ai-secrets-no-var-conflict` | `55ded23b` | 2026-06-02 | not merged | fix(deploy): stop --var AI keys; secret put after deploy only | Manual triage required before merge, archive, or delete |
| `fix/prod-ai-worker-secrets` | `99e3bab1` | 2026-06-02 | not merged | fix(deploy): persist OpenAI/Anthropic keys via wrangler secret put on pr | Manual triage required before merge, archive, or delete |
| `chore/agents-md-continual-learning` | `942a0cc5` | 2026-06-02 | merged | chore: refresh AGENTS.md from continual-learning run | Manual triage required before merge, archive, or delete |
| `chore/enable-auth-hibp` | `92e3d559` | 2026-05-29 | merged | Enable Supabase leaked password protection via Management API workflow. | Manual triage required before merge, archive, or delete |
| `cursor/discussion-status-silent-failure-c12b` | `d99441f8` | 2026-05-28 | not merged | Fix participant stakeholder discussion status updates | Manual triage required before merge, archive, or delete |
| `cursor/critical-bug-investigation-c421` | `018a5e17` | 2026-05-28 | not merged | fix(web): use service role for analysis job rpc | Manual triage required before merge, archive, or delete |
| `cursor/critical-bug-investigation-7dfb` | `c4f98586` | 2026-05-27 | not merged | fix(auth): block unsafe Telegram identity linking | Manual triage required before merge, archive, or delete |
| `chore/actions-runtime-refresh` | `ffd099fc` | 2026-05-27 | merged | chore(ci): upgrade workflow actions to Node24-native versions | Manual triage required before merge, archive, or delete |
| `cursor/auth-and-dashboard-issues-eb7c` | `9f738640` | 2026-05-26 | not merged | Fix auth identity sync regressions | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-7cfa` | `8c36711d` | 2026-05-26 | not merged | fix(security): require cron secret on staging | Manual triage required before merge, archive, or delete |
| `cursor/technical-documentation-updates-569f` | `b8126236` | 2026-05-25 | not merged | docs: fix deploy runbook whitespace | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-4030` | `d5f51947` | 2026-05-25 | not merged | test: isolate analysis status route mocks | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-84c0` | `34573f22` | 2026-05-24 | not merged | fix(ios): prevent stale manager task data | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-20fe` | `bf1c3faa` | 2026-05-23 | not merged | fix(ci): fail pilot smoke on unhealthy healthcheck | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-af15` | `6a8001de` | 2026-05-22 | not merged | fix: use server worker day ids on ios | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-2263` | `f064274e` | 2026-05-21 | not merged | test: clean report lint regressions | Manual triage required before merge, archive, or delete |
| `cursor/critical-correctness-bugs-85e3` | `47011c84` | 2026-05-20 | not merged | fix: restore dashboard gate and android bootstrap | Manual triage required before merge, archive, or delete |
| `chore/deep-production-completion` | `8529a91c` | 2026-05-12 | merged | chore(agents): sync learned dashboard routing and OpenNext/layout notes | Manual triage required before merge, archive, or delete |
| `chore/next-after-pr12` | `c600b7e6` | 2026-05-03 | merged | Merge pull request #12 from 2qjckdknjf-ctrl/feat/platform-owner-cabinet | Manual triage required before merge, archive, or delete |
| `feat/platform-owner-cabinet` | `b4b7b3fe` | 2026-05-03 | merged | chore(ci): retrigger checks after removing stale vercel integration | Manual triage required before merge, archive, or delete |
| `develop` | `e509f537` | 2026-04-27 | merged | Merge PR #11: pilot audit E2E, staging CI hook, public UI fixes | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-08` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-09` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-10` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-11` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-12` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-13` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-14` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-15` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-16` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-17` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-18` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-19` | `0c40ed50` | 2026-04-08 | merged | fix(ai-router): fallback to next provider on auth errors | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-29` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-30` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-31` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-01` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-02` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-03` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-04` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-05` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-06` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-04-07` | `6d03c7e7` | 2026-03-29 | merged | docs(db): note production evidence doc commit in git truth | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-28` | `0c7479a7` | 2026-03-28 | merged | docs(release1): Wave 3 cross-worker closure — live denial proof, seed me | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-25` | `3d329d38` | 2026-03-25 | merged | fix(android-manager): Maestro-visible report row tags; manager pilot wai | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-26` | `3d329d38` | 2026-03-25 | merged | fix(android-manager): Maestro-visible report row tags; manager pilot wai | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-27` | `3d329d38` | 2026-03-25 | merged | fix(android-manager): Maestro-visible report row tags; manager pilot wai | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-19` | `62a57842` | 2026-03-19 | merged | Remove domain redirects from middleware | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-20` | `62a57842` | 2026-03-19 | merged | Remove domain redirects from middleware | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-21` | `62a57842` | 2026-03-19 | merged | Remove domain redirects from middleware | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-22` | `62a57842` | 2026-03-19 | merged | Remove domain redirects from middleware | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-23` | `62a57842` | 2026-03-19 | merged | Remove domain redirects from middleware | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-24` | `62a57842` | 2026-03-19 | merged | Remove domain redirects from middleware | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-18` | `99ed42a8` | 2026-03-18 | merged | ci(A2): blocking post-deploy pilot smoke via reusable workflow | Manual triage required before merge, archive, or delete |
| `cursor-test` | `3d88f1ba` | 2026-03-15 | merged | fix(vercel): update install command to include dev dependencies for Verc | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-15` | `3d88f1ba` | 2026-03-15 | merged | fix(vercel): update install command to include dev dependencies for Verc | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-16` | `3d88f1ba` | 2026-03-15 | merged | fix(vercel): update install command to include dev dependencies for Verc | Manual triage required before merge, archive, or delete |
| `snapshots/2026-03-17` | `3d88f1ba` | 2026-03-15 | merged | fix(vercel): update install command to include dev dependencies for Verc | Manual triage required before merge, archive, or delete |
| `ops/external-setup-attempt` | `6d112cb0` | 2026-03-15 | merged | fix(ci): add missing web source files for cloudflare build | Manual triage required before merge, archive, or delete |
| `cursor/android-platform-launch-b8bb` | `1ae0b23d` | 2026-03-07 | not merged | docs: add local setup instructions | Manual triage required before merge, archive, or delete |
| `cursor/development-environment-setup-ba4b` | `9b989079` | 2026-03-04 | not merged | docs: add AGENTS.md with Cursor Cloud development instructions | Manual triage required before merge, archive, or delete |
| `cursor/development-environment-setup-b598` | `47c6f8a4` | 2026-02-24 | not merged | Add AGENTS.md with Cursor Cloud development instructions | Manual triage required before merge, archive, or delete |

### DELETE NEVER WITHOUT BACKUP (8)

| Branch | Last SHA | Last commit | vs `main` | Reason (subject) | Recommended action |
|---|---|---|---|---|---|
| `audit/architecture-lockdown-forensic-intake-2026-06-22` | `cd147ee3` | 2026-06-22 | merged | docs: audit architecture lockdown report intake | Require tag/export backup evidence before any deletion consideration |
| `hotfix/deploy-workflow-yaml` | `a04d16b0` | 2026-06-15 | merged | fix(ci): unblock deploy workflows after invalid reusable-job continue-on | Require tag/export backup evidence before any deletion consideration |
| `claude/aistroyka-audit-security-infra-cg810i` | `193e9b80` | 2026-06-14 | not merged | fix(sync): stop masking cursor-read DB errors as cursor 0 | Require tag/export backup evidence before any deletion consideration |
| `docs/supabase-performance-advisors` | `3c834c5b` | 2026-05-29 | merged | Document Supabase performance advisor triage after RLS policy split. | Require tag/export backup evidence before any deletion consideration |
| `fix/supabase-stakeholder-status-rpc-hardening` | `b3151032` | 2026-05-28 | merged | fix(db): wrap RLS helper definers behind invoker functions | Require tag/export backup evidence before any deletion consideration |
| `fix/supabase-offline-count-rpc-hardening` | `338726d1` | 2026-05-27 | merged | fix(db): harden offline-device count RPC grants | Require tag/export backup evidence before any deletion consideration |
| `fix/supabase-create-analysis-job-rpc-surface` | `65b72d1d` | 2026-05-27 | merged | fix(db): restrict create_analysis_job RPC to service role | Require tag/export backup evidence before any deletion consideration |
| `fix/deploy-ref-validation-clean` | `a39c58e6` | 2026-05-19 | merged | fix(release): document deploy failure audit and rerun evidence | Require tag/export backup evidence before any deletion consideration |
