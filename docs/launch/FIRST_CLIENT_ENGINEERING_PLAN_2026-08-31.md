# First-client Day-0 — engineering closeout plan

> **For agentic workers:** execute tracks in order. Owner-gated tracks (3) cannot be closed in this repo. Spec: `docs/audit/FIRST_CLIENT_GAP_AUDIT_2026-08-31.md`.

**Goal:** Close every **engineering** gap that still sits between a live `143930f` platform and a controlled first-client Day-0, without faking owner/client work.

**Architecture:** Day-0 is operational (intake → tenant → TestFlight → device smoke → support → sign-off). Engineering only removes product/docs friction on that path. iOS is the field contour. Android stays deferred. Billing, Twilio, AI Flywheel, Public GA stay out.

**Tech stack:** Next.js / Cloudflare Workers, iOS Shared SPM + Worker/Manager, docs under `docs/launch/` and `docs/CURRENT_PROJECT_TRUTH_INDEX.md`.

**Spec:** `docs/audit/FIRST_CLIENT_GAP_AUDIT_2026-08-31.md` + `docs/launch/PILOT_DAY0_GO_NO_GO.md`

## Global constraints

- Do not invent a real client, fill `pilot-intake.real.local.json`, or upload TestFlight (`APPROVE_TESTFLIGHT_UPLOAD` unset).
- Do not add Twilio / phone OTP as a gate. Do not flip `ENTITLEMENT_RESOLUTION_SOURCE`.
- Do not expand Android product scope. iOS-primary; Android-only workers = NO-GO unless written waiver.
- Do not replace Privacy/Terms draft copy with invented legal text — link to live `/privacy` and `/terms` (still counsel-pending).
- Do not commit secrets. Branch from `origin/main`, not the merged `fix/mobile-visual-walk` tip.
- Customer-finance boundary unchanged.

---

## Track map

| Track | Who | Unblocks | This session |
|-------|-----|----------|--------------|
| 0 Docs truth | Engineering | Operators stop following March Android-P0 / Vercel rollback | **Start now** |
| 1 iOS in-app legal URLs | Engineering | Store hygiene + honest login/settings links | **Start now** |
| 2 Account deletion | Engineering (API + iOS) | App Store 5.1.1(v); not required for internal TestFlight | Next PR after Track 1 |
| 3 Owner Day-0 ops | Owner + client | Phase 12 `launchAllowed` | Blocked external |
| 4 Explicitly out | — | — | Do not start |

---

## Track 0: Docs truth (operator unblock)

**Files:**
- Create: `docs/mobile/P3_ANDROID_DEFER_DECISION.md` (cited by `PILOT_INTAKE_CARD.md`, missing)
- Modify: `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md` (supersede banner)
- Modify: `docs/launch/PILOT_DAY0_GO_NO_GO.md` (SHA `143930f`; close stale PR #229/forgot-password; keep launch NO)
- Modify: `docs/launch/STAGE5_ROLLBACK_AND_SUPPORT.md` (Cloudflare not Vercel; iOS-primary)
- Modify: `docs/CURRENT_PROJECT_TRUTH_INDEX.md` (header only — live SHA)
- Modify: `docs/tz/00_OPEN_BLOCKERS.md` (P0-DOC-1 → resolved by P3 decision)
- Modify: `STATUS.md`

**Produces:** Single authoritative Android answer for Day-0; GO/NO-GO matches production.

- [x] Write this plan
- [x] Add P3 Android defer decision (August 2026 supersedes March 2026 lock)
- [x] Refresh GO/NO-GO + truth index + support rollback host
- [x] Point March scope lock at P3 / Phase 12

---

## Track 1: iOS legal links (product)

**Files:**
- Modify: `ios/Shared/Sources/Shared/Config.swift` — `publicLocaleCode`, `publicPageURL(slug:locale:)`, `privacyPolicyURL`, `termsOfServiceURL`
- Create: `ios/Shared/Sources/Shared/PublicLegalLinks.swift` — SwiftUI `Link` pair, ids `pilot_legal_privacy` / `pilot_legal_terms`
- Create: `ios/Shared/Tests/SharedTests/ConfigPublicLegalURLTests.swift`
- Modify: Worker `LoginView.swift`, `ProfileOfflineSettingsView.swift`
- Modify: Manager `ManagerLoginView.swift`, `ManagerSettingsView.swift`
- Modify: `en|ru|es|it.lproj/Localizable.strings` in both apps (`legal_privacy`, `legal_terms`)
- Modify: `WorkerV43UITests.testLoginSurfaceExposesCanonAndLegacyAuth`, `ManagerV43UITests.testLoginScreen_v43ContinueAndAppleAreReachable`

**Produces:** Tappable Privacy/Terms to `{BASE_URL}/{en|ru|es|it}/privacy|terms`. Locale fallback `en`. Uses API `Config.baseURL` so staging E2E hits staging pages.

- [x] Failing Shared tests for locale mapping
- [x] Config + `PublicLegalLinks`
- [x] Wire login + settings; UITest asserts identifiers exist (do not tap — opens Safari)

---

## Track 2: Account deletion (App Store 5.1.1(v))

- [x] `DELETE /api/v1/me` with `{ confirm: "DELETE" }` — caller Auth user + memberships/devices only
- [x] Lite allow-list GET+DELETE `/api/v1/me`
- [x] iOS Worker settings + Manager settings/More confirmation UI
- [x] Web dashboard `/dashboard/settings/auth`
- [x] Public `/account-deletion` for App Store Connect URL + website 5.1.1(v)
- [ ] On production after merge (not yet — this branch)

Does **not** delete tenant projects/reports. Auth user is **soft-deleted** so operational `ON DELETE RESTRICT` FKs (task messages, defects, etc.) stay valid. Last admin may leave an orphaned tenant — Apple-compliant.

---

## Track 3: Owner / client only (do not fake)

1. Fill gitignored `docs/launch/pilot-intake.real.local.json` → `bun run pilot:intake:validate` READY.
2. Staging tenant + project + invites (`PILOT_DAY0_TENANT_PROJECT_SETUP.md`).
3. `APPROVE_TESTFLIGHT_UPLOAD=YES` + ASC key + build number → Worker + Manager.
4. `PILOT_DAY0_DEVICE_SMOKE_REPORT.md` on physical iPhones.
5. Named support email/on-call in intake.
6. Owner + sponsor sign-off → `launchAllowed: YES` → Phase 13.

---

## Track 4: Do not start for first client

Twilio/phone OTP, Google Play, AI Flywheel (#111 / PR #265), account-first billing, Public GA, Worker video comment, redesign, Android product parity.

---

## Done when

- Operators reading launch docs see Android **deferred**, production **143930f**, rollback **Cloudflare**.
- Worker and Manager login/settings open live Privacy/Terms.
- Shared unit tests pass; UITests see legal identifiers.
- Account deletion implemented on this branch (API + iOS + dashboard). Live only after merge/deploy.
- Day-0 remains **NO-GO** until Track 3.

---

*Plan written 2026-08-31. Execution starts Track 0 + 1 immediately.*
