# AISTROYKA Current Project Truth Index

**Last updated:** 2026-07-30 (Phase 6 Android deferred-track note; historical main SHA below unchanged)
**Canonical main SHA:** `2fe776f298d4a94eccfa8bc5745968692b77fb0f`

## 1. Purpose

This document is the **current project truth index** for AISTROYKA.

Historical docs under `docs/` may contain older readiness, certification, GO/NO-GO, or “production ready” claims. Those documents are **evidence snapshots** unless explicitly revalidated here.

**If a historical doc conflicts with this index, this index wins** unless newer dated evidence (SHA, PR, CI, deployment, smoke, governance) supersedes it.

## 2. Current main

| Field | Value |
|-------|-------|
| **main commit** | `2fe776f298d4a94eccfa8bc5745968692b77fb0f` |
| **date** | 2026-06-26 |
| **repo** | `2qjckdknjf-ctrl/Aistroyka-web` |

### Latest merged post-baseline slices (on main)

| PR | Topic |
|----|-------|
| #120 | API security headers |
| #122 | Live/staging smoke runbook (`docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md`) |
| #124 | Architecture lockdown forensic audit (docs-only intake) |
| #125 | GitHub governance forensic audit + remediation evidence |
| #126 | Diagnostics route test stabilization (test-only) |
| #127 | Reports export UI polish (UI/i18n/tests only) |
| #128 | Current project truth index (this file) |
| #129 | Stale branch archival plan (docs-only) |
| #130 | Branch archival dry-run manifest (docs-only) |
| #131 | Branch archival execution report (docs-only) |
| #132 | Security follow-up audit for issue #114 (docs-only) |
| #133 | Middleware page security header regression tests (test-only) |
| #134 | Truth index housekeeping (docs-only) |
| #135 | Design/public follow-up audit for issue #113 (docs-only) |
| #136 | Public CTA copy alignment — i18n-only, pilot-first EN/RU/ES/IT (no components/layout/CSS/design-system/mobile/backend changes) |
| #138 | Public homepage truth cleanup — removed `MOCK_METRICS` / fake numeric claims; qualitative capability cards; pilot-first CTAs preserved (homepage component + i18n only; no design-system/Liquid Glass/mobile/backend changes) |
| #139 | Truth index housekeeping after PR #138 (docs-only) |
| #140 | Mobile fresh audit for issue #112 (docs-only) — current iOS/Android state on main, branch risk, validation reality, one safe next slice |
| #141 | Mobile pilot readiness docs refresh (`docs/release-hardening/MOBILE_PILOT_READINESS.md`, docs-only) — corrects stale Android/WorkerLite claims |
| #142 | AGENTS.md continual-learning durable learnings update (docs/governance-only) |
| #143 | Truth index housekeeping after PRs #140–#142 (docs-only) |
| #144 | Mobile build/pilot evidence plan for issue #112 (docs-only) — iOS/Android/web buildStamp evidence requirements, go/no-go checklist, future execution prompt; `MOBILE_PILOT_READINESS.md` cross-link |
| #145 | Truth index housekeeping after PR #144 (docs-only) |
| #146 | iOS simulator evidence report for issue #112 (docs-only) — first real iOS native evidence: simulator build PASS + login-surface UITest smoke PASS |

## 3. What is verified

- **CI/build/test on main after PR #146:** green in operator validation (install, lint, contracts, i18n:check, `I18N_CHECK_ALL=1` i18n:check, tests, build, cf:build).
- **Test count (post PR #146):** 1546/1546 passing in full suite run.
- **Security headers slice (PR #120 scope):** API header slice PASS; verified with staging/production smoke at time of that slice (see PR #120 evidence; not re-run by this index).
- **Security follow-up (issue #114, CLOSED):** PR #132 audit + PR #133 regression tests — page/login/protected-redirect CSP and page security headers covered in `middleware.security-headers.test.ts`; API CSP omission remains covered; no production code, middleware runtime, or auth/RBAC changes in PR #133.
- **Governance (issue #110):** P0 remediation applied (`enforce_admins: true`); issue closed after non-author APPROVED protected merge of forensic audit PR #125.
- **Reports export UI (issue #118):** acceptance criteria met via PR #127; protected merge with non-author approval; backend CSV schema, role gates, and `/api/v1/reports/export` authorization unchanged.
- **Architecture lockdown forensic intake (PR #124):** external “9.5/10 CERTIFIED” claim **rejected** — documented in `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/`.
- **Design/public follow-up (issue #113, CLOSED):** PR #135 docs-only audit + PR #136 i18n-only public CTA copy alignment (EN/RU/ES/IT pilot-first wording: Launch pilot → Contact us → Get presentation); Cabinet/login CTAs unchanged. No components/layout/CSS, design-system, mobile, or backend/API changes.
- **Public homepage truth cleanup (PR #138):** homepage `MOCK_METRICS` constant and fake numeric claims (`500+`, `12K+`, `8K+`, `45K+`) removed; metrics cards replaced with truthful qualitative capability statements; pilot-first CTAs preserved. Scope: `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` + EN/RU/ES/IT `public.homeMetrics` only; no design-system, Liquid Glass, mobile, or backend/auth/RBAC changes. `i18n:check` and `I18N_CHECK_ALL=1 i18n:check` PASS.
- **Mobile fresh audit (issue #112, OPEN):** PR #140 docs-only audit recorded current `main` mobile state — iOS Manager + Worker present/source-complete (WorkerLite→Worker rename complete); Android Manager + Worker present as Compose scaffolds (Worker has FCM + an instrumented launch test), thinner than iOS; shared API/auth/session aligned to `/api/v1`. Broad mobile merge remains **unsafe** (`release/mobile-pilot-rc` still `manual_review_again`); no TestFlight/App Store/Google Play/pilot-live/deploy claim made. Audit docs: `docs/reconciliation/issue-112-mobile-fresh-audit-2026-06-26/`.
- **Mobile pilot readiness refresh (PR #141):** `docs/release-hardening/MOBILE_PILOT_READINESS.md` refreshed to current `main` — corrected stale "Android: no app in repo" and "WorkerLite rename in progress" claims; clarified native validation requirements (iOS needs Xcode/simulator; Android needs SDK/Gradle); referenced confirmed workflows `ios-ui-smoke.yml`, `ios-e2e-integration.yml`, `android-instrumented-smoke.yml`; no store/pilot-live/deployment claim added. Docs-only.
- **AGENTS.md durable learnings (PR #142):** continual-learning update — anti-fake homepage metrics preference (no synthetic production-scale numbers; qualitative capability statements) and mobile workspace facts (Android Manager/Worker Compose apps exist on `main`, thinner than iOS, Worker FCM + instrumented launch test; iOS WorkerLite→Worker rename complete; readiness tracked in `docs/release-hardening/MOBILE_PILOT_READINESS.md`; no store/pilot-live claims without verified evidence). Docs/governance-only; no secrets.
- **Mobile build/pilot evidence plan (issue #112, OPEN):** PR #144 docs-only plan defining the exact evidence required before any mobile claim — iOS (Xcode/simulator/device build + UITest smoke; archive/signing/upload/TestFlight/App Store), Android (Android SDK/Gradle/JDK 17/emulator assemble + instrumented launch; release bundle/signing/Play upload), and web `buildStamp.sha7` deployment evidence; plus a mobile pilot **go/no-go checklist** (all gates **NOT VERIFIED** at this SHA) and a future execution prompt. **No native builds were run; no TestFlight/App Store/Google Play/pilot-live/deploy claim made.** Plan: `docs/reconciliation/issue-112-mobile-build-evidence-plan-2026-06-26/`; readiness cross-link added to `docs/release-hardening/MOBILE_PILOT_READINESS.md`.
- **First real iOS native evidence (issue #112, OPEN — partial):** PR #146 docs-only evidence report captured a real iOS simulator run at evidence SHA `2607842599e0149ba60357124e035c8bebcef206` — **iOS simulator build PASS** (Worker + Manager, Debug iphonesimulator, signing disabled) and **login-surface UITest smoke PASS** (`WorkerSmokeUITests` + `ManagerSmokeUITests`), on **Xcode 26.5 / 17F42**, **iPhone 17 Pro** simulator, schemes `AiStroykaWorker`/`AiStroykaManager`. Local build required copying gitignored `ios/Config/Secrets.xcconfig` from `Secrets.xcconfig.example` (CI `ios-ui-smoke.yml` pattern). **No signing, no TestFlight/App Store upload, no iOS source/Android/web/workflow/env changes.** Login-surface smoke is **not** full iOS/pilot readiness. Report: `docs/reconciliation/issue-112-ios-simulator-evidence-2026-06-26/`.
- **Production runtime on current main (2026-06-28, read-only):** `GET https://aistroyka.ai/api/v1/health` returned `buildStamp.sha7 = bc992b7` (buildTime `2026-06-26 15:57`), matching `origin/main` short SHA `bc992b72` — so **latest main is deployed** (verified via build stamp). Production public landing (`/en`) returned HTTP 200 (~183 KB) with **0 Liquid Glass markers**, which is **consistent with current main** (main has no `liquid-glass` components). **Liquid Glass is NOT live and NOT in main** — it remains on unmerged design branches; no deploy was performed. Evidence: `docs/reconciliation/production-public-drift-2026-06-28/`.

## 4. What is NOT verified

- **Latest main deployment after PR #146** is **not** automatically confirmed unless a deployment run and/or `GET /api/v1/health` `buildStamp.sha7` on production/staging proves the merged SHA.
- **Mobile build/pilot/store status** is **not** fully verified for launch. **iOS:** Phase 5 closed simulator Layer B (**YES**); physical device smoke and TestFlight remain external/not authorized. **Android:** Phase 6 **YES — DEFERRED** — Debug assemble + shared unit tests PASS; Android is **not** a first-pilot commitment; live FCM / emulator smoke / Google Play remain out of deferred scope. No Google Play / pilot-live claim.
- **Architecture lockdown 9.5/10** is **not** accepted as current truth.
- **Broad merge** of `cursor/aistroyka-system-maturity-7957` is **not safe** (584 commits behind main; high-risk surface; see PR #124 audit).
- **Public GA** is **not** declared by this index or by docs-only updates.
- **AI / mobile / design** broad branches are **not** automatically accepted without fresh rebase, small-slice audit, and protected merge.
- **Historical GO/NO-GO, pilot-ready, or production-ready docs** are **not** current truth without revalidation against this SHA and runtime evidence.

## 5. Status by area

| Area | Current status | Evidence | Next safe step |
|------|----------------|----------|----------------|
| **Web main** | Post-baseline reconciliation + polish slices merged | main `2fe776f2`; PRs #120–#146 | Continue small scoped slices; full validation per PR |
| **Production runtime** | Deployed SHA **not assumed** equal to latest main | Confirm via Cloudflare/Vercel + `/api/v1/health` buildStamp | Run deploy/smoke only per `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md` when operator-approved |
| **Security headers** | API slice PASS (#120); page regression tests added (#133); issue #114 **CLOSED** | PR #120, #132, #133; `apps/web/middleware.security-headers.test.ts` | No further issue #114 slices unless new evidence-backed gap |
| **Governance** | Remediated; protected merge process verified | PR #125; issue #110 closed; `enforce_admins: true` | Non-author APPROVED + CI before every main merge |
| **Reports export UI** | Polish merged (#127) | PR #127; issue #118 | No backend/CSV/role changes without explicit audit |
| **Architecture lockdown** | **NOT verified** (9.5/10 rejected) | `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/` | Do not broad-merge maturity branch; obtain primary source if claim persists |
| **AI / Flywheel** | Deferred; not production-certified | Issue #111 stacked audit | Fresh rebase + small-slice audit before implementation |
| **Mobile pilot** | **iOS-primary** first pilot; Phase 5 iOS Layer B **YES**; Android **deferred** (P3 Option A / Phase 6 YES — DEFERRED). Historical issue #112 audits remain evidence snapshots. | Phase 5/6 closures under `docs/roadmap/`; `docs/mobile/P3_ANDROID_DEFER_DECISION.md`; `docs/release-hardening/MOBILE_PILOT_READINESS.md` | Do not expand Android without owner/client mandate; iOS device/TestFlight and Play remain owner-gated; no speculative Android MVP |
| **Design / Public** | Follow-up audit (#135) + i18n-only CTA alignment (#136) + homepage `MOCK_METRICS` cleanup (#138) merged; issue #113 **CLOSED** | PRs #135, #136, #138; `docs/reconciliation/issue-113-design-public-followup-2026-06-24/` | No broad design-branch merges; Liquid Glass requires fresh rebase + explicit small-slice plan |
| **Docs truth** | Index merged (#128); housekeeping updates ongoing (#134, #137, #139, #143, #145 + this update); AGENTS.md learnings refreshed (#142) | Issue #116; PRs #128, #134, #137, #139, #142, #143, #145; this file | Narrow index updates only; avoid mass doc rewrites |
| **Stale branches** | Owner-approved archival executed (#131); 21 branches tagged/deleted | `docs/reconciliation/branch-archival-execution-2026-06-24/` | No broad merges; `cursor/aistroyka-system-maturity-7957` remains forbidden |

## 6. Historical docs policy

- Readiness, certification, GO/NO-GO, pilot-ready, and “final verdict” documents are **historical evidence**.
- They are **not** automatically current truth for today’s `main`.
- Any **CERTIFIED**, **PRODUCTION READY**, **GA**, **LOCKED DOWN**, or numeric score claim (e.g. 9.5/10) requires **current** main SHA, PR, CI, deployment/smoke, and governance evidence if used as a **runtime** or **release** claim.
- Forensic/reconciliation audits under `docs/reconciliation/` describe **point-in-time** findings; check their dated baseline SHA.

### Key evidence-only docs (non-exhaustive)

- `docs/publication-readiness/FINAL_GO_NO_GO_AUDIT.md`
- `docs/release/FINAL_GO_NO_GO_VERDICT.md`
- `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/`
- `docs/reconciliation/issue-110-github-governance-forensic-2026-06-23/`
- `docs/reconciliation/issue-116-docs-truth-stacked-audit/`
- `docs/reconciliation/issue-114-security-followup-2026-06-24/`

## 7. Forbidden assumptions

- Do **not** claim production readiness from docs alone.
- Do **not** broad-merge stale architecture/AI/mobile/design branches.
- Do **not** use owner/admin bypass for protected merges (`enforce_admins` must stay enabled).
- Do **not** apply live Supabase migrations without explicit operator gate.
- Do **not** deploy or claim live smoke PASS without following `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md` and confirming buildStamp.
- Do **not** accept external architecture lockdown certification without in-repo reproducible rubric + SHA + CI proof on `main`.

## 8. Current safe backlog (prioritized)

1. **#111 AI** — only after fresh rebase and small-slice audit (Phase 7 track). Mobile: iOS Phase 5 closed (simulator Layer B); Android Phase 6 **deferred** — do not start Android MVP without owner/client mandate; store uploads remain owner-gated.
2. **Truth index housekeeping** — narrow updates after each merged slice (docs-only).
3. **~~Homepage `MOCK_METRICS` removal~~** — **DONE** (PR #138; fake numeric metrics removed, qualitative cards, pilot-first CTAs preserved).
4. **~~#113 design/public~~** — **CLOSED** (PR #135 audit + PR #136 i18n-only CTA alignment + PR #138 homepage cleanup).
5. **~~#114 middleware/security~~** — **CLOSED** (PR #132 audit + PR #133 regression tests).
6. **~~#116 docs truth~~** — initial index merged (#128); ongoing housekeeping only.
7. **~~#117 stale branch archival~~** — plan (#129), dry-run (#130), execution (#131) complete; no broad merges.

---

*For deployment topology and canonical paths, see `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`. For live/staging smoke policy, see `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md`.*
