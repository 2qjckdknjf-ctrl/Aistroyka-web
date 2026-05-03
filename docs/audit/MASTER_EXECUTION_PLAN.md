# AISTROYKA Master Execution Plan

Updated: 2026-05-01
Branch: `feat/platform-owner-cabinet`
Scope: full stabilization pass with evidence-driven closure criteria.

## Phase Status Board

| Phase | Goal | Risk | Status |
| --- | --- | --- | --- |
| 1 | Repository integrity and tooling | High | Closed |
| 2 | Build/test/typecheck baseline | High | Closed |
| 3 | API surface and contract hardening | High | Closed (audit + one fix) |
| 4 | Supabase/database/migration verification | High | Closed |
| 5 | Auth/tenant/security hardening | High | Closed with P1 notes |
| 6 | Worker critical flow completion | High | Closed (backend contract verified) |
| 7 | iOS Worker validation | High | Closed (simulator build) |
| 8 | Android truth audit | Medium | Closed (buildable partial) |
| 9 | Copilot/AI runtime stabilization | High | Closed with external runtime dependency notes |
| 10 | Documents/acts/contracts closure | Medium | Closed at repo level; live env verification blocked externally |
| 11 | Budget/cost closure | Medium | Closed at repo level; live DB verification blocked externally |
| 12 | Manager dashboard/actionability closure | Medium | Closed at repo level; interactive UX verification blocked externally |
| 13 | Release/CI/smoke/ops hardening | High | Closed with P1 ops notes |
| 14 | Final full validation | High | Closed |
| 15 | Final report and readiness verdict | High | Closed |

## Phase Plan (Ordered by Risk)

### Phase 1 — Repository integrity and tooling
- Goal: verify working tree safety, ignore policy, artifact leakage, secret exposure risks.
- Tasks: dirty-file audit, tracked artifact review, gitignore review, filename/pattern secret scan.
- Likely files: `.gitignore`, `apps/web/.gitignore`, repo root layout.
- Validation: `git status`, `git diff --stat`, secret filename/pattern scan.
- Done criteria: no hidden destructive changes; risks documented.

### Phase 2 — Build/test/typecheck baseline
- Goal: establish truthful green baseline on local environment.
- Tasks: install deps, run typecheck path, lint, tests, build, `cf:build`.
- Likely files: root `package.json`, `apps/web/package.json`, contracts package.
- Validation commands: `bun install --frozen-lockfile`, `bunx tsc -p apps/web/tsconfig.json --noEmit`, `bun run lint`, `bun run test`, `bun run build`, `bun run cf:build`.
- Done criteria: all required commands pass; failures fixed or externally blocked with proof.

### Phase 3 — API surface and contract hardening
- Goal: verify canonical `/api/v1/*`, classify legacy/system routes, close contract/type gaps.
- Tasks: route inventory, auth/tenant check sampling on mutating routes, fix compile/contract issues.
- Likely files: `apps/web/app/api/**/route.ts`, contracts package.
- Validation: route tests in `vitest`, `tsc`, build.
- Done criteria: no unresolved P0/P1 route regressions in local verification.

### Phase 4 — Database/Supabase/migration verification
- Goal: migration order safety, required entities presence, RLS coverage.
- Tasks: migration inventory, timestamp/duplication checks, required table and RLS scan.
- Likely files: `apps/web/supabase/migrations/*.sql`.
- Validation: migration naming/order script, SQL scans, test/build sanity.
- Done criteria: schema risks documented; no destructive migration introduced.

### Phase 5 — Auth/tenant/security hardening
- Goal: preserve tenant boundaries and secure operational routes.
- Tasks: middleware review, tenant guard review, admin/system/owner route protection checks.
- Likely files: `apps/web/middleware.ts`, `apps/web/lib/tenant/*`, security-sensitive routes.
- Validation: unit/api tests, lint/typecheck/build.
- Done criteria: no missing critical guards in sampled high-risk routes.

### Phase 6 — Worker critical flow completion
- Goal: verify worker flow contract end-to-end at API layer.
- Tasks: route-level validation for day start, tasks today, report create/submit, upload finalize, sync bootstrap/changes/ack.
- Likely files: `apps/web/app/api/v1/worker/**`, `apps/web/app/api/v1/media/upload-sessions/**`, `apps/web/app/api/v1/sync/**`.
- Validation: route tests + full test suite.
- Done criteria: contracts enforced; idempotency/auth present where required.

### Phase 7 — iOS Worker validation
- Goal: prove iOS Worker build viability for pilot.
- Tasks: inspect project structure/config binding; build for simulator without signing.
- Likely files: `ios/AiStroykaWorker/**`, `ios/Shared/**`, `ios/Config/Secrets.xcconfig`.
- Validation: `xcodebuild -list`, simulator `build`.
- Done criteria: simulator build succeeds or exact blocker captured.

### Phase 8 — Android truth audit
- Goal: classify Android readiness honestly.
- Tasks: inspect Gradle/toolchain and shared API layer; run `assembleDebug`.
- Likely files: `android/**`.
- Validation: `./gradlew assembleDebug`.
- Done criteria: readiness classification with evidence.

### Phase 9 — Copilot/AI runtime stabilization
- Goal: verify AI endpoints are guarded, observable, and fallback-safe.
- Tasks: inspect stream/fallback/test coverage, provider key handling, telemetry events.
- Likely files: `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.ts`, `apps/web/app/api/v1/ai/**`, `apps/web/lib/copilot/**`.
- Validation: AI route tests within full suite.
- Done criteria: no critical leakage/guard gap found in audited path.

### Phase 10 — Documents/acts/contracts closure
- Goal: confirm manager document workflow exists as real API/UI integration.
- Tasks: verify document model/routes/UI panel integration and tests.
- Likely files: document domain/service files, dashboard project detail panels.
- Validation: related API tests + build.
- Done criteria: repo-level flow complete; external live verification noted if missing.

### Phase 11 — Budget/cost closure
- Goal: verify cost CRUD and dashboard integration readiness.
- Tasks: verify migration, domain repository/service, API coverage, dashboard tab integration.
- Likely files: cost migrations/routes/domain/dashboard files.
- Validation: cost-related tests + build.
- Done criteria: repo-level cost layer complete with explicit residual blockers.

### Phase 12 — Manager dashboard/actionability closure
- Goal: ensure manager UI exposes actionable paths with real routes.
- Tasks: inspect dashboard landing + project detail tabs + drill-down links/empty states.
- Likely files: `apps/web/app/[locale]/(dashboard)/dashboard/**`.
- Validation: build + dashboard-related tests.
- Done criteria: no fake links/placeholders masquerading as complete features.

### Phase 13 — Release/CI/smoke/ops hardening
- Goal: validate release controls, env gating, and smoke script integrity.
- Tasks: inspect workflows, deploy configs, smoke scripts, env docs.
- Likely files: `.github/workflows/*`, `apps/web/wrangler*.toml`, `scripts/smoke/*`, `docs/ENVIRONMENT-VARIABLES.md`.
- Validation: `bash -n` smoke/release scripts + build chain.
- Done criteria: safe release path documented with explicit external dependencies.

### Phase 14 — Final full validation
- Goal: rerun strongest local validation set and record outputs.
- Validation: git state, typecheck, lint, tests, build, `cf:build`, migration sanity, mobile builds.
- Done criteria: all local checks pass or are externally blocked with proof.

### Phase 15 — Final report and readiness verdict
- Goal: provide explicit pilot/production/new-feature decision.
- Deliverables: master final report, risk register, validation log, operator action list.
