# AISTROYKA 100 Percent Completion Plan

Date: 2026-07-25
Status: Active operating plan
Primary repo: `/Users/alex/Projects/AISTROYKA`
Current verdict: NO-GO for first real client launch until the gates below are closed.

This plan converts the project from "large working system with open gates" to proof-based readiness. It is designed for Cursor-assisted execution with a strict loop:

`audit -> implement -> validate -> fix failures -> validate again -> closure verdict`

No phase may move forward with known local failures, skipped required checks, undocumented gaps, or "later" notes.

## 0. Meaning Of 100 Percent

For this project, 100 percent means evidence-based closure:

- The phase has a written audit before implementation.
- Every issue discovered in the phase scope is either fixed or proven to be an external blocker.
- Every required local check passes.
- Every failed check is fixed and rerun until green.
- Customer-finance isolation remains intact.
- No secrets or real pilot PII are committed.
- Docs and code agree with runtime evidence.
- The phase ends with a YES closure verdict and a short evidence list.

Future unknown bugs can still exist. They do not count against phase closure if they were not discoverable by the required audit/checks. Known local issues do count and must be fixed before moving on.

## 1. Global Rules For Every Phase

- Read `AGENTS.md`, `.cursor/rules/aistroyka-roadmap.mdc`, `.cursor/rules/aistroyka-100-percent-execution.mdc`, this file, and `docs/CURRENT_PROJECT_TRUTH_INDEX.md`.
- Work in one phase only.
- Do not refactor broad architecture unless the phase explicitly requires it.
- Do not weaken auth, tenant isolation, platform-owner gates, Cloudflare Access assumptions, RLS boundaries, or customer-finance isolation.
- Do not merge stale Liquid Glass, mobile, release, or design branches broadly.
- Do not change store-upload or production-deploy behavior without explicit owner approval.
- Do not treat Android as a first-pilot blocker unless the owner or pilot client explicitly requires Android.
- If a check cannot run because of credentials, physical devices, or service access, document the exact missing value and stop the phase with `BLOCKED_EXTERNAL`.

## 2. Phase Map

| Phase | Name | Goal | Exit Verdict |
| --- | --- | --- | --- |
| 0 | Baseline freeze | Create one current source of truth | YES only when docs, code, checks, and live endpoints are mapped |
| 1 | P0 deps/security/design gate | Remove immediate local blockers | YES only when audits/checks are green |
| 2 | Backend API/RBAC/finance isolation | Prove API safety and customer boundary | YES only when negative tests pass |
| 3 | Web product flows | Prove public, dashboard, portal, admin flows | YES only when multi-role E2E passes or is externally blocked |
| 4 | Mobile backend contracts | Prove sync, media, devices, push contracts | YES only when contract and runtime checks pass |
| 5 | iOS pilot readiness | Prove Worker and Manager on simulator/device/TestFlight path | YES only when Layer B/device evidence exists |
| 6 | Android deferred or readiness track | Either lock defer or complete Android MVP gates | YES only when decision is explicit and evidence-backed |
| 7 | AI reliability | Prove live provider path or honest degraded mode | YES only when production/staging claim is accurate |
| 8 | Ops/deploy/observability | Prove staging/prod deploy, rollback, monitoring | YES only when runbooks and smoke evidence match runtime |
| 9 | Pilot Day0 | Prepare first real client launch | YES only when client, tenant, roles, devices, support, signoff are done |
| 10 | Final 100 closure | Remove stale claims and publish final verdict | YES only when all prior phases are YES |

## 3. Phase 0 - Baseline Freeze

Goal: stop conflicting readiness claims and define the exact current state.

Audit scope:

- `docs/CURRENT_PROJECT_TRUTH_INDEX.md`
- `docs/DEVELOPMENT_ROADMAP.md`
- `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md`
- `docs/launch/P4_GO_NO_GO.md`
- `docs/launch/PILOT_DAY0_GO_NO_GO.md`
- `docs/mobile/P3_ANDROID_GO_NO_GO.md`
- `docs/qa/reports/RELEASE_VERDICT.md`
- `docs/qa/reports/COVERAGE_REPORT.md`
- `apps/web/package.json`, root `package.json`, lockfiles
- live `/api/v1/health` for staging and production

Required checks:

```bash
git status --short --branch
bun --version
bun run lint
bun run test
bun run build
bun run --cwd apps/web check:design
npm audit --omit=dev
```

Mobile baseline checks:

```bash
JAVA_HOME=/Users/alex/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home ./gradlew :shared:test :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
xcodebuild -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -scheme AiStroykaManager -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Exit criteria:

- One new baseline report under `docs/roadmap/` or `docs/launch/`.
- Current NO-GO reasons listed.
- Old contradictory claims marked as stale by reference, not by deleting history.
- Next phase has exact file list and checks.

## 4. Phase 1 - P0 Dependencies, Security, And Design Gate

Goal: remove blockers that make all later work noisy or unsafe.

Known starting issues:

- Dependency audit reports vulnerabilities in `next`, `postcss`, `sharp`, `form-data`, `brace-expansion`, and `body-parser`.
- `apps/web` design check fails because raw Tailwind colors are still present, including `amber-500`.
- Production health lacks `buildStamp`, and production reports `aiConfigured=false`.
- Public response headers contain duplicates for several security headers.

Implementation scope:

- Upgrade vulnerable dependencies with minimal version movement.
- Regenerate only the required lockfiles.
- Replace raw design colors with AISTROYKA tokens.
- Fix duplicate security header emission at the shared source, without weakening header values.
- Add or update tests for the changed security/design helpers.

Required checks:

```bash
bun install --frozen-lockfile
node scripts/ci/validate-npm-lock.cjs
bun run --cwd apps/web check:design
bun run lint
bun run test
bun run build
bun run cf:build
npm audit --omit=dev
(cd packages/contracts && npm audit --omit=dev)
```

Exit criteria:

- No high/critical dependency findings in production audit.
- Design check passes.
- Web build and OpenNext/Cloudflare build pass.
- Security headers are not duplicated in local or deployed response checks.

## 5. Phase 2 - Backend API, RBAC, Tenant, And Customer-Finance Isolation

Goal: prove the API is safe for real pilot users.

Audit scope:

- All `/api/v1/*` route groups.
- `apps/web/middleware.ts`
- tenant context and policy files.
- platform-owner gates.
- lite allow-list and idempotency helpers.
- portal/share/customer-facing routes.
- customer-finance guard usage.

Implementation scope:

- Add missing negative tests for customer, owner, stakeholder, member, viewer, tenant admin, and platform owner surfaces.
- Enforce customer-finance guard on every customer-facing response path.
- Close idempotency or rate-limit gaps for lite allowed POST routes, especially telemetry/event endpoints.
- Verify legacy route aliases cannot bypass v1 gates.
- Keep platform admin owner-only and read-only where documented.

Required checks:

```bash
bun run lint
bun run test
bun run build
bun run --cwd apps/web test -- --runInBand
```

Additional targeted proof:

- Tests must assert customers cannot see internal cost, margin, profitability, planned/actual amount, internal budget pressure, subcontractor costs, or internal AI finance risk.
- Tests must assert tenant admins cannot access platform-owner APIs.
- Tests must assert lite mobile clients receive 403 outside the allow-list.

Exit criteria:

- All changed route and policy tests pass.
- No known customer-finance leak path remains.
- No known platform-owner bypass remains.
- Closure report names every protected surface checked.

## 6. Phase 3 - Web Product Flows And UX

Goal: prove the web product is usable across the real first-pilot flows.

Audit scope:

- Public site and locale routes.
- Login/register/dashboard entry.
- Contractor dashboard.
- Client portal.
- Admin cabinet.
- Platform admin and Operations Center.
- Responsive layouts and accessibility.

Implementation scope:

- Fix route reachability, redirect, and empty-state problems.
- Remove stale public claims and fake metrics if any reappeared.
- Ensure public Cabinet entry remains visible.
- Add or repair Playwright tests for critical flows.
- Fix visual overlaps and raw design-token drift found in audit.

Required checks:

```bash
bun run --cwd apps/web check:design
bun run lint
bun run test
bun run build
bun run --cwd apps/web e2e:pilot
```

If E2E credentials are missing:

- Do not mark the phase YES.
- Document exact missing variables.
- Keep the verdict `BLOCKED_EXTERNAL`.

Exit criteria:

- Public, dashboard, portal, admin, and platform-admin smoke flows pass.
- No known responsive blocker on mobile/tablet/desktop.
- Accessibility issues found in phase are fixed or documented as external/product decision.

## 7. Phase 4 - Mobile Backend Contracts

Goal: prove the backend contract used by mobile is complete and resilient.

Audit scope:

- worker endpoints.
- manager endpoints.
- media upload session flow.
- sync and 409 conflict behavior.
- device register/unregister.
- push service APNS/FCM path.
- lite allow-list and idempotency.

Implementation scope:

- Replace push stubs with real send path if credentials are available.
- Add contract tests for mobile write idempotency.
- Add sync conflict tests for server cursor behavior.
- Verify media upload session create/finalize/add-media flow.
- Ensure mobile clients cannot call non-mobile API surfaces.

Required checks:

```bash
bun run lint
bun run test
bun run build
```

Exit criteria:

- Mobile contract tests pass.
- Push is either real and tested, or explicitly blocked by missing APNS/FCM credentials.
- Sync/media/device flows have automated coverage.

## 8. Phase 5 - iOS Pilot Readiness

Goal: move iOS from build/login-smoke to pilot-ready evidence.

Audit scope:

- `ios/Shared`
- `ios/AiStroykaWorker`
- `ios/AiStroykaManager`
- Worker report/media/offline/resubmit flow.
- Manager review flow.
- secrets and signing config.
- UITests and E2E scripts.

Implementation scope:

- Fix any iOS compile, runtime, or UI smoke failures.
- Add missing tests for Worker -> report/media/submit and Manager -> review.
- Validate Layer B live E2E when credentials exist.
- Prepare TestFlight evidence path without committing signing assets.
- Ensure app names, icons, permissions, and release metadata are correct.

Required checks:

```bash
xcodebuild -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -scheme AiStroykaManager -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
xcodebuild test -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -only-testing:AiStroykaWorkerUITests/WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers CODE_SIGNING_ALLOWED=NO
xcodebuild test -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -scheme AiStroykaManager -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -only-testing:AiStroykaManagerUITests/ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers CODE_SIGNING_ALLOWED=NO
```

Exit criteria:

- Worker and Manager build.
- Worker and Manager smoke tests pass.
- Layer B live E2E passes or is blocked only by missing credentials/device.
- TestFlight/device smoke evidence exists before launch YES.

## 9. Phase 6 - Android Deferred Or Readiness Track

Goal: avoid mixed claims. Android is either officially deferred or completed as a separate release track.

Default decision:

- Android is deferred for first pilot unless the owner or client explicitly requires Android.

If deferred:

- Keep Android build green.
- Keep docs and public claims honest.
- Do not expand Android scope before iOS pilot readiness.

If required:

- Add offline durable queue parity.
- Add Worker report/media/resubmit tests.
- Add Manager review tests.
- Replace placeholder Firebase config.
- Prepare Play internal test evidence.

Required checks:

```bash
JAVA_HOME=/Users/alex/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home ./gradlew :shared:test :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
```

Exit criteria:

- Deferred path: explicit owner/client signoff and no public Android readiness claim.
- Readiness path: debug/release builds, instrumented flow tests, push config, and Play evidence.

## 10. Phase 7 - AI Reliability

Goal: make AI claims match runtime.

Audit scope:

- AI provider config.
- AI smoke scripts.
- dashboard/user-facing AI routes.
- fallback/degraded behavior.
- production and staging health.

Implementation scope:

- Fix production AI config if AI is advertised as live.
- Run live provider smoke with non-fallback proof.
- Label degraded/beta behavior clearly where live provider is unavailable.
- Do not claim Level 4/live AI unless the required smoke passes.

Required checks:

```bash
bash scripts/smoke/ai_live_provider.sh --require-live
bun run lint
bun run test
bun run build
```

Exit criteria:

- AI live provider proof exists, or release notes explicitly state degraded/beta mode.
- Production/staging health claims are accurate.

## 11. Phase 8 - Ops, Deploy, Observability, And Rollback

Goal: prove the release path can be operated safely.

Audit scope:

- Cloudflare staging/production deployment.
- `/api/v1/health` and buildStamp.
- security headers.
- Supabase migration parity.
- rollback runbook.
- alerts and first 72h operating protocol.

Implementation scope:

- Ensure staging and production expose buildStamp or an equivalent commit proof.
- Fix header duplication.
- Run staging smoke before production.
- Document rollback rehearsal.
- Add missing alert/runbook checks.

Required checks:

```bash
bun run build
bun run cf:build
bash scripts/smoke/security_headers.sh
```

Live checks:

```bash
curl -fsS https://staging.aistroyka.ai/api/v1/health
curl -fsS https://www.aistroyka.ai/api/v1/health
```

Exit criteria:

- Staging and production runtime proof match the intended commit.
- Rollback and first-72h operations are documented and rehearsed.
- No duplicated or weakened security headers.

## 12. Phase 9 - Pilot Day0

Goal: prepare the first real client launch.

Required inputs:

- selected pilot client.
- approved client intake.
- pilot tenant/project/accounts.
- worker and manager users.
- support email/process.
- iPhone device/TestFlight availability.
- owner/client sponsor signoff.

Implementation scope:

- Run tenant/project setup runbook.
- Run role access checks.
- Run iOS Worker device smoke.
- Run iOS Manager review smoke.
- Confirm Android deferred or required.
- Update Day0 go/no-go docs with evidence.

Exit criteria:

- `PILOT_DAY0_GO_NO_GO` becomes YES with evidence.
- No open P0/P1 launch blocker remains.
- Signoff exists.

## 13. Phase 10 - Final 100 Closure

Goal: remove contradictions and produce the final release verdict.

Audit scope:

- all phase closure reports.
- truth index.
- go/no-go docs.
- public claims.
- launch docs.
- stale readiness claims.

Implementation scope:

- Update `docs/CURRENT_PROJECT_TRUTH_INDEX.md`.
- Update launch and roadmap closure docs.
- Mark stale documents as superseded by reference if needed.
- Produce final 100 percent closure report.

Required checks:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

Exit criteria:

- All phases 0-9 are YES.
- No stale GO claim conflicts with runtime.
- Final release verdict is clear: GO, conditional GO, or NO-GO with exact external blockers.

## 14. Standard Phase Closure Template

Use this at the end of every phase:

```md
# Phase N Closure

Verdict: YES | NO | BLOCKED_EXTERNAL
Date:
Branch:

## Scope

## Audit Findings

## Changes Made

## Checks Run

| Check | Result | Evidence |
| --- | --- | --- |

## Failures Found And Fixed

## Remaining Blockers

## Files Changed

## Next Phase Allowed?

YES only if verdict is YES.
```

