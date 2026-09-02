# AISTROYKA — gap audit before first real client

**Date:** 2026-08-31  
**Auditor:** production-readiness pass against live runtime + 100% Readiness program  
**Live SHA:** `143930fd` (`buildStamp.sha7=143930f`) on **staging and production**  
**Production deploy:** [run 33378769893](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/33378769893) — **success** (including blocking pilot smoke, security headers, stakeholder finance sanity)  
**Classification:** platform is a **controlled-pilot candidate**. **First-client Day-0 = NO-GO.** Not Public GA.

Production audit (skill scoring, not a legal/compliance certificate):

- **Platform / runtime: 76/100 — launchable with caveats** (controlled iOS-primary pilot, owner-gated distribution).
- **First-client Day-0: 38/100 — blocked** (every named client operational gate is still open).

---

## 1. What “first client” means here

Authoritative for this audit is the **100% Readiness** program, not Public GA and not the March 2026 Android+iOS week lock:

| Source | Definition |
|--------|------------|
| `docs/roadmaps/AISTROYKA_100_PERCENT_READINESS_2026-08-21.md` | Phase 12 — *pilot tenant ready without engineering intervention* |
| `docs/reports/PHASE12_CLIENT_DAY0_2026-08-23.md` | Intake + tenant/project/roles + device smoke + support + owner/client sign-off |
| `docs/launch/PILOT_DAY0_GO_NO_GO.md` | Same gates; **Launch allowed: NO** (2026-08-23, still true 2026-08-31) |
| `docs/launch/PILOT_INTAKE_CARD.md` | Contour: Worker daily reports + photos → Manager approve/resubmit. Android default **NO**. Portal / budget / full AI **not required** |

**In scope for Day-0:** iOS Worker field loop, iOS Manager or web dashboard review, staging-first tenant, TestFlight on client iPhones, named support path.

**Out of scope for Day-0:** Public GA, Android product parity, live Stripe checkout for every tenant, `ENTITLEMENT_RESOLUTION_SOURCE` account-first cutover, phone OTP/Twilio, AI Flywheel, Gold Memory, SCIM, another redesign.

---

## 2. Verdict in one paragraph

The product **runs** on production (`aistroyka.ai` health `ok`, `aiConfigured: true`, SHA match). Auth (email, Apple, Google), forgot-password API, dashboard, Worker/Manager iOS V4.3, AI live gate, finance isolation CI, and Day-0 **operator tooling** exist. What is missing is not “another feature slice”: it is **a named client**, **their tenant**, **apps on their phones**, **a support owner**, and **written GO**. Until those close, Phase 13 Controlled Pilot must not start.

---

## 3. Live evidence checked (2026-08-31)

| Check | Result |
|-------|--------|
| `GET https://aistroyka.ai/api/v1/health` | `ok`, env `production`, `sha7=143930f`, `aiConfigured=true`, DB/Supabase/service role OK |
| `GET https://staging.aistroyka.ai/api/v1/health` | `ok`, env `staging`, `sha7=143930f` |
| Production workflow 33378769893 | **success** (deploy + blocking smokes) |
| `origin/main` | `143930fd` — merge of PR #277 |
| `GET /en/login` | HTTP 200; **Continue with Google** and **Continue with Apple** present; no OTP copy |
| `GET /en/privacy` | HTTP 200; still **“Draft — pending legal counsel approval.”** |
| `POST /api/v1/auth/forgot-password` | Route **live** (HTTP 400 validation) — Phase 8 “404 until PR #229” is **stale** |
| `docs/launch/pilot-intake.real.local.json` | **Absent** on this operator machine |
| Open GitHub issues | #158 TestFlight, #159 Play, #160 distribution decision, #111 AI Flywheel (post-pilot) |

**Evidence missing (would raise Day-0 score):** filled real intake; staging client tenant IDs; TestFlight processing + physical device checklist with screenshots; named support email; counsel-approved legal; live APNs on a real token.

---

## 4. Program status (100% Readiness)

| Phase | Name | Status vs first client |
|-------|------|------------------------|
| 0–11 | Truth → RC freeze `v1.0.0-rc.1` | **CONDITIONAL YES** (2026-08-22/23). Platform certified at RC; main has since advanced to `143930f`. |
| **12** | **Client Day-0** | **NO / CLOSED (BLOCKED)** — intake, tenant, device, support, sign-off |
| 13 | Controlled Pilot | **NOT STARTED — BLOCKED** on Phase 12 YES |
| 14–15 | Pilot closure / Public GA | **BLOCKED** |

Mega-roadmap `docs/product/PHASE13_ROADMAP_CLOSURE.md` (**CONDITIONAL YES**, 2026-06-16) closed **product scope** for a pilot candidate. That is **not** the same as 100% program Phase 12/13 (named client kickoff). Do not treat June Phase 13 as “first client already launched”.

`docs/CURRENT_PROJECT_TRUTH_INDEX.md` last updated **2026-08-24** (`3838726a`) — **stale vs live `143930f`**. Trust health + this audit until the index is refreshed.

---

## 5. What is done (do not rebuild)

### Platform

- Cloudflare production + staging on the same SHA; health, DB, AI flags green.
- Auth: email + Apple + Google on web login; iOS native Apple + Google PKCE; Worker QR; phone OTP **disabled-optional** (no Twilio required).
- Password recovery API live on production.
- Security headers + post-deploy smoke + stakeholder finance sanity **passed** on this production deploy.
- Billing: checkout **not required** for Day-0 (`PHASE8` **DEFERRED BY DECISION**). Do **not** flip `ENTITLEMENT_RESOLUTION_SOURCE`.
- Customer-finance isolation: repo + historical live proof; this deploy’s stakeholder job succeeded. **Client-tenant** re-proof still required after a real portal user exists.

### Operator pack (Day-0 tooling)

- Templates: `docs/launch/pilot-intake.template.json`, `PILOT_INTAKE_CARD.md`, `validate_pilot_intake.mjs`.
- Runbooks: tenant setup, device smoke, GO/NO-GO, role access.
- Synthetic example intake validates READY. Real intake does not exist.

### iOS (primary contour)

- Worker + Manager V4.3 screens wired to live APIs; simulator UITest + staging Layer B E2E **proven** in Phase 5 / later visual-walk work.
- Release archive + store validation proven historically; **TestFlight upload still owner-gated**.
- Android: buildable Compose apps; **explicitly not required** for current Day-0 (`PILOT_DAY0_GO_NO_GO.md`).

---

## 6. What is not done before the first client

### P0 — launch-blocking (operational)

These are the actual first-client blockers. Engineering cannot close them without owner/client input.

| # | Gap | Why it blocks Day-0 | Evidence |
|---|-----|---------------------|----------|
| 1 | **Real client intake** | No company, sponsor, users, devices, limitations accepted | `pilot-intake.real.local.json` missing; `PILOT_DAY0_GO_NO_GO.md` |
| 2 | **Client tenant / project / invites** | Nowhere for the client to log in with *their* accounts | `PILOT_DAY0_TENANT_PROJECT_SETUP.md` — NOT CREATED / NOT AUTHORIZED |
| 3 | **TestFlight MODE B** | Field workers cannot install Worker from the store path | `APPROVE_TESTFLIGHT_UPLOAD` unset; issues #158 / #160 |
| 4 | **Physical device smoke** | Simulator E2E ≠ client iPhone: camera, photos, push, TestFlight build | `PILOT_DAY0_DEVICE_SMOKE_REPORT.md` — NOT TESTED |
| 5 | **Support owner + email** | First incident has no named channel | intake `support.*` empty; `STAGE5_ROLLBACK_AND_SUPPORT.md` DRAFT |
| 6 | **Owner + client sign-off** | Program forbids `launchAllowed: YES` without it | GO/NO-GO sign-off PENDING |
| 7 | **Production tenant authorization** | Staging-first is required; prod mutation still unanswered | tenant setup runbook |

If any field worker is **Android-only**, current policy is **NO-GO** unless they use iPhone/TestFlight or an explicit web-only waiver.

### P1 — high risk before a confident kickoff (waive in writing or fix)

| # | Gap | Impact |
|---|-----|--------|
| 1 | **Legal Privacy/Terms still drafts** on live `/en/privacy` | First commercial client may refuse; App Store hygiene |
| 2 | **Stakeholder finance sanity on *client* tenant** | Isolation proven on smoke/prod CI, not on the named client’s portal user |
| 3 | **On-call roster not assigned** | Phase 11 council / on-call NOT TESTED |
| 4 | **Live APNs delivery** | Register API proven; physical push **NOT TESTED** |
| 5 | **No iOS crash reporting** (Sentry or equivalent) | First crash on a client phone is invisible |
| 6 | **Invitation email live mailbox proof** | Invites exist in product; inbox delivery not exercised this program |
| 7 | **App Store hygiene:** account deletion + in-app legal links | Blocks public App Store; TestFlight internal can proceed with owner risk |
| 8 | **Product-design P1 tails:** client portal shell, dual project tabs | Not in Day-0 contour unless client needs portal Day-0 |

### P2 — not required for first client (do not start as Day-0 work)

- Android product parity / Google Play upload (`APPROVE_GOOGLE_PLAY_UPLOAD`).
- Phone OTP / Twilio.
- Live Stripe checkout for all tenants; account-first entitlements.
- AI Flywheel / issue #111 / open PR #265 Agentic Foundation.
- Worker video + free-text comment (March lock; waive or schedule post-pilot).
- Public GA, SCIM, ERP, Gold Memory, another redesign.
- Open iOS polish PRs (#273–#276) — useful, not Day-0 gates.
- Rollback *drill* (docs exist; not executed) — ops hygiene.

---

## 7. Doc conflict: Android mandatory vs deferred

| Document | Date | Claim |
|----------|------|--------|
| `FIRST_CLIENT_SCOPE_LOCK.md` | 2026-03-24 | Android **mandatory** for first client |
| `FIRST_CLIENT_BLOCKER_REGISTER.md` | 2026-03-24 | Android Worker/Manager **P0** |
| `PILOT_DAY0_GO_NO_GO.md` + Phase 6/12 | 2026-08-22/23 | Android **NO**, not a launch blocker |
| `AGENTS.md` | current | iOS primary; defer Android expansion |

**Resolution for this audit:** August 2026 Day-0 docs **supersede** the March week lock. `docs/tz/00_OPEN_BLOCKERS.md` **P0-DOC-1** is still unreconciled in-repo (missing `P3_ANDROID_DEFER_DECISION.md`). Action: one supersede pointer, not rebuilding Android for Day-0.

March P0 “Android is a stub” is **partially stale** (Compose apps exist and build). It is **not** a Day-0 product.

---

## 8. Surfaces vs first-client contour

| Surface | Day-0 need | Status |
|---------|------------|--------|
| Public site + contact/pilot form | Lead-in | Live; legal drafts remain |
| Web dashboard (contractor) | Fallback for Manager | Live on `143930f` |
| Web login Apple/Google | Same accounts as mobile | Live |
| iOS Worker | **Required** for field loop | Product ready; **not on client devices** |
| iOS Manager | Optional vs web | Product ready; same distribution gap |
| Android Worker/Manager | Not required | Scaffold; Play owner-gated |
| Stakeholder `/portal` | Optional | Isolation CI green; client-tenant unproven |
| Billing / subscribe | Not required | Deferred |
| AI copilot / intelligence | Optional extra | Live gate configured; not in intake required scope |

---

## 9. Recommended sequence (do not skip)

1. Owner fills gitignored `docs/launch/pilot-intake.real.local.json` from the template; `bun run pilot:intake:validate` until **READY**. Resolve Android-only workers here.
2. Provision **staging** tenant + project + manager/worker invites (`PILOT_DAY0_TENANT_PROJECT_SETUP.md`). Do not reuse smoke tenant without written approval.
3. Owner grants TestFlight MODE B (`APPROVE_TESTFLIGHT_UPLOAD=YES` + ASC key + build number) and uploads Worker + Manager.
4. Run `PILOT_DAY0_DEVICE_SMOKE_REPORT.md` on physical iPhones: login → photos → submit → manager decision.
5. Name support email/channel + on-call; freeze known limitations with the client (no Android, no video comment, legal drafts if still unsigned).
6. Re-run stakeholder finance sanity **if** portal users are in scope for this client.
7. Owner + sponsor sign `PILOT_DAY0_GO_NO_GO.md` → `launchAllowed: YES` → only then Phase 13.

**Next concrete action:** intake JSON. Everything else waits on a named client.

---

## 10. What would change the scores

| If this happens | Day-0 score |
|-----------------|-------------|
| Intake READY + staging tenant + TestFlight smoke PASS + support named + sign-off | Move to **launchable with caveats** (~70+) and start Phase 13 |
| Legal still draft but client accepts in writing | P1, not P0 |
| Android-only crew with no waiver | Stay **blocked** |
| Claiming GA because production SHA matches | Invalid — Phase 15 still blocked |

---

*Evidence-backed engineering triage, not legal/financial certification. Historical GO/NO-GO docs are snapshots; this file + live `buildStamp` win for 2026-08-31.*
