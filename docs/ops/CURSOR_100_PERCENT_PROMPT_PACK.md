# Cursor 100 Percent Prompt Pack

Date: 2026-07-25
Use with: `/Users/alex/Projects/AISTROYKA`

These prompts are intentionally strict. Cursor must not do broad "fix everything" work. Each prompt narrows the scope, requires an audit first, then implementation, then verification, then immediate repair of any failures.

## Master Prompt For Any Phase

```text
You are working in /Users/alex/Projects/AISTROYKA.

First read these files completely:
- AGENTS.md
- .cursor/rules/aistroyka-roadmap.mdc
- .cursor/rules/aistroyka-100-percent-execution.mdc
- docs/roadmap/AISTROYKA_100_PERCENT_COMPLETION_PLAN.md
- docs/ops/CURSOR_100_PERCENT_PROMPT_PACK.md
- docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md
- docs/CURRENT_PROJECT_TRUTH_INDEX.md

Work only on PHASE: <PUT_PHASE_NUMBER_AND_NAME_HERE>.

Strict loop:
1. Audit first. Do not edit files until you identify the exact gaps, affected files, tests, commands, and exit criteria.
2. Implement only the scoped fixes for this phase.
3. Run every required check for this phase.
4. If any check fails, fix the failure immediately and rerun the same check.
5. Repeat until all required checks pass.
6. Do not move to the next phase.
7. Do not leave TODO, "later", skipped checks, or known local failures.
8. If blocked by credentials, physical device, service access, or owner approval, stop with BLOCKED_EXTERNAL and document exact evidence.

Hard constraints:
- Do not revert user changes or dirty worktree changes that you did not make.
- Do not commit secrets, env files, signing assets, real pilot PII, or generated build artifacts.
- Do not weaken auth, tenant isolation, RLS, platform-owner gates, Cloudflare Access assumptions, or customer-finance isolation.
- Customer/stakeholder/share/owner surfaces must never expose contractor internal costs, margin, profitability, budget pressure, subcontractor costs, or internal AI finance risks.
- Keep Android deferred for first pilot unless explicitly told otherwise.

At the end, write a phase closure note:
- Verdict: YES, NO, or BLOCKED_EXTERNAL
- Files changed
- Checks run and results
- Failures found and fixed
- Remaining blockers
- Whether the next phase is allowed
```

## Phase 0 Prompt - Baseline Freeze

```text
Use the Master Prompt.

PHASE: 0 - Baseline freeze.

Goal:
Create a current evidence-based baseline for AISTROYKA. Do not change product behavior in this phase unless a check script or doc reference is clearly broken and must be fixed to complete the baseline.

Audit:
- docs/CURRENT_PROJECT_TRUTH_INDEX.md
- docs/DEVELOPMENT_ROADMAP.md
- docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md
- docs/launch/P4_GO_NO_GO.md
- docs/launch/PILOT_DAY0_GO_NO_GO.md
- docs/mobile/P3_ANDROID_GO_NO_GO.md
- docs/qa/reports/RELEASE_VERDICT.md
- docs/qa/reports/COVERAGE_REPORT.md
- root package.json and apps/web/package.json
- live staging and production health endpoints

Run the baseline checks listed in docs/roadmap/AISTROYKA_100_PERCENT_COMPLETION_PLAN.md.

Output:
Create a baseline report under docs/roadmap/ with:
- current GO/NO-GO verdict
- exact failing gates
- commands run
- live endpoint evidence
- next phase file list

Do not proceed to Phase 1.
```

## Phase 1 Prompt - P0 Dependencies, Security, Design Gate

```text
Use the Master Prompt.

PHASE: 1 - P0 dependencies, security, and design gate.

Goal:
Make the local release gate clean enough for further work. Fix dependency vulnerabilities, design-token violations, and duplicate security headers without broad refactors.

Audit first:
- package.json files and lockfiles
- apps/web security header source
- design check output
- raw color usage in platform-admin UI
- npm audit output

Implement:
- Upgrade vulnerable dependencies minimally.
- Regenerate only required lockfiles.
- Replace raw Tailwind colors with AISTROYKA design tokens.
- Fix duplicate security headers at the shared source without weakening values.
- Add or update targeted tests if helpers changed.

Required checks:
- bun install --frozen-lockfile
- node scripts/ci/validate-npm-lock.cjs
- bun run --cwd apps/web check:design
- bun run lint
- bun run test
- bun run build
- bun run cf:build
- npm audit --omit=dev
- cd packages/contracts && npm audit --omit=dev

If any check fails, fix and rerun. Do not proceed to Phase 2.
```

## Phase 2 Prompt - Backend API, RBAC, Tenant, Finance Isolation

```text
Use the Master Prompt.

PHASE: 2 - Backend API, RBAC, tenant, and customer-finance isolation.

Goal:
Prove that real pilot users cannot cross tenant, role, platform-owner, lite-client, or customer-finance boundaries.

Audit first:
- apps/web/app/api/v1
- apps/web/middleware.ts
- tenant context and policy files
- platform-owner gate files
- lite allow-list and idempotency helpers
- portal/share/customer-facing routes
- customer-finance guard tests and usage

Implement:
- Add missing negative tests for customer, owner, stakeholder, member, viewer, tenant admin, and platform owner.
- Enforce customer-finance guard on every customer-facing response path.
- Close idempotency or rate-limit gaps for lite allowed POST routes.
- Verify legacy aliases cannot bypass v1 gates.

Required checks:
- bun run lint
- bun run test
- bun run build

Do not mark YES unless tests prove finance isolation and platform-owner isolation.
Do not proceed to Phase 3.
```

## Phase 3 Prompt - Web Product Flows And UX

```text
Use the Master Prompt.

PHASE: 3 - Web product flows and UX.

Goal:
Prove public, dashboard, portal, admin, and platform-admin flows are reachable, localized, responsive, and free of known visual blockers.

Audit first:
- public locale routes
- login/register/dashboard redirects
- contractor dashboard
- client portal
- admin cabinet
- platform-admin and Operations Center
- existing Playwright and QA tests
- design-system checks

Implement:
- Fix broken routes, redirects, empty states, visible text overflow, responsive overlaps, stale claims, and raw token drift found in scope.
- Add or repair Playwright tests for critical flows.

Required checks:
- bun run --cwd apps/web check:design
- bun run lint
- bun run test
- bun run build
- bun run --cwd apps/web e2e:pilot

If E2E credentials are missing, stop as BLOCKED_EXTERNAL with exact env vars needed.
Do not proceed to Phase 4.
```

## Phase 4 Prompt - Mobile Backend Contracts

```text
Use the Master Prompt.

PHASE: 4 - Mobile backend contracts.

Goal:
Prove mobile sync, media, device, worker, manager, and push contracts are safe and resilient.

Audit first:
- worker endpoints
- manager endpoints
- media upload sessions
- sync conflict handling
- device register/unregister
- push APNS/FCM service
- lite allow-list and idempotency

Implement:
- Add contract tests for mobile write idempotency.
- Add sync conflict tests for server cursor behavior.
- Add media upload session tests.
- Add device registration tests.
- Replace push stubs only if credentials/config are available; otherwise document BLOCKED_EXTERNAL.

Required checks:
- bun run lint
- bun run test
- bun run build

Do not proceed to Phase 5.
```

## Phase 5 Prompt - iOS Pilot Readiness

```text
Use the Master Prompt.

PHASE: 5 - iOS pilot readiness.

Goal:
Move iOS Worker and Manager from build/login-smoke to real pilot evidence.

Audit first:
- ios/Shared
- ios/AiStroykaWorker
- ios/AiStroykaManager
- Worker report/media/offline/resubmit flow
- Manager review flow
- UITests and E2E scripts
- signing and secrets references, without printing or committing secrets

Implement:
- Fix compile, runtime, or UI smoke failures.
- Add missing Worker and Manager tests for pilot-critical flows.
- Prepare TestFlight evidence path without committing signing assets.

Required checks:
- Worker Debug simulator build
- Manager Debug simulator build
- Worker login smoke UITest
- Manager login smoke UITest
- Layer B live E2E if credentials exist

If credentials, physical device, or signing assets are missing, stop as BLOCKED_EXTERNAL with exact missing inputs.
Do not proceed to Phase 6.
```

## Phase 6 Prompt - Android Deferred Or Readiness

```text
Use the Master Prompt.

PHASE: 6 - Android deferred or readiness track.

Goal:
Keep Android claims honest. Default is deferred for first pilot unless explicitly told Android is required.

Audit first:
- docs/mobile/P3_ANDROID_GO_NO_GO.md
- android shared module
- AiStroykaWorker Android app
- AiStroykaManager Android app
- Firebase/FCM config state
- instrumented tests

If deferred:
- Keep builds green.
- Update docs/claims so Android is not presented as first-pilot ready.

If required:
- Add offline/resubmit parity work.
- Add Worker and Manager instrumented flow tests.
- Replace placeholder Firebase config.
- Prepare Play internal test evidence.

Required check:
JAVA_HOME=/Users/alex/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home ./gradlew :shared:test :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug

Do not proceed to Phase 7.
```

## Phase 7 Prompt - AI Reliability

```text
Use the Master Prompt.

PHASE: 7 - AI reliability.

Goal:
Make AI user-facing claims match runtime. Either prove live provider behavior or clearly label degraded mode.

Audit first:
- AI runtime docs
- AI smoke scripts
- AI config/env assumptions
- dashboard and user-facing AI routes
- staging and production health

Implement:
- Fix config/code if live AI is intended.
- Add tests or smoke proof for non-fallback AI response.
- Update user-facing labels/release notes if degraded mode remains.

Required checks:
- bash scripts/smoke/ai_live_provider.sh --require-live
- bun run lint
- bun run test
- bun run build

Do not claim live AI unless the live provider smoke passes.
Do not proceed to Phase 8.
```

## Phase 8 Prompt - Ops, Deploy, Observability, Rollback

```text
Use the Master Prompt.

PHASE: 8 - Ops, deploy, observability, and rollback.

Goal:
Prove staging and production are observable, deployable, and rollback-safe.

Audit first:
- Cloudflare deployment docs
- health/buildStamp behavior
- security headers
- Supabase migration parity docs/scripts
- rollback runbooks
- alerting and first 72h docs

Implement:
- Ensure staging and production expose commit proof.
- Fix duplicate security headers if still present.
- Add missing smoke/runbook checks.
- Document rollback rehearsal evidence.

Required checks:
- bun run build
- bun run cf:build
- bash scripts/smoke/security_headers.sh
- curl staging health
- curl production health

Do not proceed to Phase 9.
```

## Phase 9 Prompt - Pilot Day0

```text
Use the Master Prompt.

PHASE: 9 - Pilot Day0.

Goal:
Prepare the first real client launch.

Audit first:
- docs/launch/PILOT_DAY0_GO_NO_GO.md
- docs/launch/P4_GO_NO_GO.md
- pilot intake template and real local intake state
- tenant/project setup runbook
- role access report
- device smoke report
- Android defer decision

Implement:
- Complete all locally possible Day0 setup.
- Run role access checks.
- Run iOS Worker and Manager device/TestFlight smoke if devices and credentials exist.
- Update Day0 docs with evidence.

If client, device, credentials, support email, or signoff are missing, stop as BLOCKED_EXTERNAL.
Do not proceed to Phase 10.
```

## Phase 10 Prompt - Final 100 Closure

```text
Use the Master Prompt.

PHASE: 10 - Final 100 closure.

Goal:
Produce a final truthful release verdict after all previous phases are YES.

Audit first:
- every phase closure report
- docs/CURRENT_PROJECT_TRUTH_INDEX.md
- launch go/no-go docs
- roadmap closure docs
- public claims
- stale readiness claims

Implement:
- Update truth index.
- Update launch docs.
- Mark stale claims as superseded by reference.
- Produce final closure report.

Required checks:
- bun run lint
- bun run test
- bun run build
- bun run cf:build

Do not mark GO unless every prior phase is YES and no local P0/P1 blocker remains.
```

