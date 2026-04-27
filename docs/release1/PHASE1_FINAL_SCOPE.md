# PHASE 1 — Final Release 1 scope (frozen)

**Mode:** Scope freeze only — **no implementation** in this document.  
**Authority:** Repository inspection (2026-03-26) + `docs/release1/PHASE0_*.md`. **Repo wins** over older launch docs where they conflict.  
**Product name:** Aistroyka — **Release 1 = Operating Truth Platform**.

---

## A. Executive decision

Release 1 will ship **nine** user surfaces (Web Admin, Web Manager, Web Client / Owner; iOS and Android each: Worker, Manager, Client). **All nine are in scope.**  
Maturity is **not** equal: some surfaces are **acceptable foundations**, some **must be completed** to meet the functional minimums below, and **two surface classes (iOS Client, Android Client) require new apps** that **do not exist** as modules in `ios/` or `android/` today (`settings.gradle.kts` lists only `:AiStroykaWorker`, `:AiStroykaManager`, `:shared`).

**Contradiction resolved (repo vs Phase 0 wording):** iOS **Xcode projects exist** in-repo as bundles:

- `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj/`
- `ios/AiStroykaManager/AiStroykaManager.xcodeproj/`

Phase 0’s “zero `.xcodeproj`” outcome was **incorrect** for the current tree (glob did not match directory-style `.xcodeproj` bundles). **Release readiness** is still **not** proven until **CI or documented reproducible builds** pass (see `PHASE1_ACCEPTANCE_GATES.md`).

**Contradiction resolved (repo vs `FIRST_CLIENT_SCOPE_LOCK.md` §4):** Android Worker **does** implement photo/upload/report API usage (`android/shared/WorkerApi.kt`, `WorkerViewModel.kt`, `WorkerApp.kt`). The scope lock table that says Android **“None”** for photos is **stale** relative to current Kotlin sources.

---

## B. Release 1 product definition

**Core formula (in scope):**  
**Project + Task + Worker Proof + Manager Review + Client Visibility + Earnings Light + AI Summary Assist**

**Canonical operational flow (must be achievable in R1 on production-grade paths):**

1. **Admin** creates tenant context and **project** (and membership as required).  
2. **Manager** creates / controls **tasks** and assigns work.  
3. **Worker** submits **proof** (report + media per agreed minimum).  
4. **Manager** **reviews** (approve / reject / request changes).  
5. **Approved** work updates **progress / object truth** visible to managers and clients.  
6. **Earnings light** reflects approved / attributable work at **read-only or summary** level (not heavy payroll).  
7. **Client** sees **progress**, **updates**, **photos**, and **decisions** where required.  
8. **Notifications** route the **next action** for each role where implemented.  
9. **AI** is **assist-only**: summaries / digests / drafts / basic risk flags **grounded in existing API + data** — **no** broad autonomous agents or full **ai-brain** experimental program.

---

## C. Mandatory surfaces (all IN R1)

| # | Surface | Repo anchor | Classification (see §E–G) |
|---|---------|-------------|-----------------------------|
| 1 | Web Admin | `apps/web/app/[locale]/(dashboard)/admin/**` | **IN R1 — ACCEPTABLE FOUNDATION** (narrow R1 strip) + **COMPLETE BEFORE LAUNCH** for R1 strip only |
| 2 | Web Manager | `apps/web/app/[locale]/(dashboard)/dashboard/**`, `projects/**`, APIs `apps/web/app/api/v1/reports/**`, `tasks/**`, `projects/**`, `notifications/**` | **IN R1 — ACCEPTABLE FOUNDATION** + **COMPLETE BEFORE LAUNCH** for mandatory minimums |
| 3 | Web Client / Owner | Role-based use of `(dashboard)` + e.g. `dashboard/projects/[id]/owner/page.tsx`, `OwnerViewClient` | **IN R1 — ACCEPTABLE FOUNDATION** + **COMPLETE BEFORE LAUNCH** for mandatory minimums |
| 4 | iOS Worker | `ios/AiStroykaWorker/**`, `ios/Shared/**`, `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj/` | **IN R1 — ACCEPTABLE FOUNDATION** + **COMPLETE BEFORE LAUNCH** for mandatory minimums |
| 5 | iOS Manager | `ios/AiStroykaManager/**`, `ios/AiStroykaManager/AiStroykaManager.xcodeproj/` | **IN R1 — ACCEPTABLE FOUNDATION** + **COMPLETE BEFORE LAUNCH** for mandatory minimums |
| 6 | iOS Client | **No app target** under `ios/` besides Worker + Manager | **IN R1 — NEW BUILD REQUIRED** |
| 7 | Android Worker | `android/AiStroykaWorker/**`, `android/shared/**` | **IN R1 — ACCEPTABLE FOUNDATION** + **COMPLETE BEFORE LAUNCH** for mandatory minimums |
| 8 | Android Manager | `android/AiStroykaManager/**` | **IN R1 — ACCEPTABLE FOUNDATION** + **COMPLETE BEFORE LAUNCH** for mandatory minimums |
| 9 | Android Client | **No Gradle module** besides `AiStroykaWorker`, `AiStroykaManager`, `shared` | **IN R1 — NEW BUILD REQUIRED** |

---

## D. Mandatory canonical flows

| Flow | In R1 | Evidence / dependency |
|------|-------|----------------------|
| F1 Admin: tenant + membership + operational settings | **YES** | Web admin + `lib/tenant/**` + tenant APIs; **narrow** to fields required for F2–F9 |
| F2 Admin / Manager: project creation | **YES** | `v1/projects`, dashboard / projects UI |
| F3 Manager: task assignment / control | **YES** | `v1/tasks`, dashboard tasks UI |
| F4 Worker: report + media + submit | **YES** | `v1/worker/report/*`, `v1/media/upload-sessions/*`; mobile apps |
| F5 Manager: report queue + detail + approve / reject / request changes | **YES** | `v1/reports`, PATCH review; web + mobile |
| F6 Progress / object truth after approval | **YES** | Project/report/task projection via existing APIs + UI (web + mobile as scoped) |
| F7 Earnings light | **YES** | **COMPLETE BEFORE LAUNCH**: define single **read model** (e.g. worker summary + approved report linkage). **Not** evidenced on iOS/Android Worker sources today (`earnings` grep **empty** in `ios/`, `android/`). |
| F8 Client: visibility + decisions | **YES** | Web: owner routes + panels; **mobile clients: NEW BUILD REQUIRED** |
| F9 Notifications: next action | **YES** | `v1/notifications/**`; **COMPLETE BEFORE LAUNCH** on iOS Manager placeholders, Android surfaces unverified in Phase 0 |
| F10 AI assist (narrow) | **YES** | Existing `/api/v1/ai/*` or project/report summary routes **only** as specified in `PHASE1_EXCLUDES.md` inverse (allow list) |

---

## E. In R1 — already exists and acceptable foundation

**Web**

- **Next.js app**, middleware, tenant context, **~160** API `route.ts` files, **68** migrations, Vitest coverage volume — **foundation**.  
- **Web Manager** operational shell: projects, tasks, reports, workers, approvals, notifications pages exist under `(dashboard)`.

**API / data**

- Worker report pipeline routes; media upload sessions; reports list + detail + review; tasks; projects; notifications endpoints — **foundation** (exact route list in repo under `apps/web/app/api/v1/`).

**iOS**

- **SwiftPM Shared** (`ios/Shared/Package.swift`), **AiStroykaWorker** and **AiStroykaManager** targets with **Xcode projects in repo** (paths in §A).  
- Worker: `WorkerAPI`, operation queue, upload services, report UI.  
- Manager: `ManagerAPI`, `ManagerTabShell`, real views + **placeholder** views (reports inbox path exists; tabs include placeholder files — see §F).

**Android**

- **Two apps + `shared`** module; `WorkerApi` / `ManagerApi` aligned to `/api/v1`.  
- Worker: Compose UI, `WorkerViewModel`, submit gated on photo unless `BuildConfig.PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` (`android/AiStroykaWorker/build.gradle.kts`, `WorkerApp.kt`).

---

## F. In R1 — exists but must be completed

**Cross-cutting**

- **Proof without debug bypass:** Android Worker **debug** allows submit without photo when `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` is true **and** `-PpilotRealSubmit` is not used — **R1 acceptance must include release-rule proof** (see gates).  
- **Worker mandatory minimums vs repo:** **Video**, **voice note**, **free-text / voice note** on Worker are **not** found in `ios/AiStroykaWorker` or `android/AiStroykaWorker` source keywords; `FIRST_CLIENT_SCOPE_LOCK.md` states **no** dedicated worker comment field in domain. **R1 completion** requires either:  
  - **(1)** schema + API + **all** Worker platforms for note + status semantics (**done / partial / blocker**), **and** media types as agreed, **or**  
  - **(2)** a **written business waiver** in scope (Phase 1 defers **only** with explicit sign-off — not assumed here). **Default:** **COMPLETE BEFORE LAUNCH** for **photo + text note + tri-state completion** minimum; **video + voice** scheduled as **COMPLETE BEFORE LAUNCH** unless waiver.  
- **Earnings light on Worker mobile:** **no** implementation evidence in mobile trees; must **consume** a defined API read model — **COMPLETE BEFORE LAUNCH**.  
- **iOS Manager** tabs: `*PlaceholderView.swift` files (e.g. `NotificationsPlaceholderView.swift`, `TasksListPlaceholderView.swift`, `TeamOverviewPlaceholderView.swift`, `AICopilotPlaceholderView.swift`, `ReportsInboxPlaceholderView.swift`, `ProjectsListView.swift` contains `ProjectDetailPlaceholderView`) — **replace or wire** to meet §G minimums for Manager.  
- **Web Admin:** entire `admin/**` tree is **large**; R1 **completes only** tenant/membership/settings/project-creation strip — not every admin page.  
- **Web Client:** complete **owner** journey for progress, feed, photos, **decisions** — map to existing APIs (`OwnerViewClient`, document/attention/issue APIs as chosen); **no** separate deployable.

**Backend caveat (verify, do not change in Phase 1):** `apps/web/app/api/v1/workers/[userId]/summary/route.ts` uses `createClient()` — if mobile Bearer must consume this for earnings light, **verify** `createClientFromRequest` / RLS behavior before R1 freeze implementation; classification: **COMPLETE BEFORE LAUNCH** verification, not blanket rewrite.

---

## G. In R1 — new build required

| Deliverable | Scope (thin client — production grade, narrow) |
|-------------|------------------------------------------------|
| **iOS Client app** | New Xcode target + Shared package dependency: login (Supabase), read-only/safe **project progress**, **activity/updates feed**, **progress photos** (from existing project/report/media APIs), **decision/action** surfaces backed by existing decision/issue/document APIs after security review, **notifications** list, **simplified status**. **No** feature parity with Worker/Manager. |
| **Android Client app** | New Gradle module `:AiStroykaClient` (name TBD): same **thin** scope as iOS Client, Compose, `shared` API client. |

**Both clients:** **IN R1 — NEW BUILD REQUIRED** until modules exist under `ios/` and `android/` with CI/build gates green.

---

## H. Out of R1 — explicitly frozen

Items **not** in Release 1 **unless** a P0 proof shows they block a canonical flow **F1–F10**:

- `paperclip/**` entire product tree  
- Broad **`apps/web/lib/ai-brain/**`** experimentation (phase packages beyond narrow assist allow list)  
- **Billing pilot expansion**, **heavy Stripe rollout** (use **existing** Stripe hooks only if required for “earnings light” read model — see `PHASE1_EXCLUDES.md`)  
- BIM, heavy documents/e-sign, ERP, marketplace, public API platform, advanced analytics, heavy payroll, **autonomous AI agents**, advanced predictive engines, broad enterprise-only modules  

---

## I. No-touch zones during R1

**PRESERVE / DO NOT TOUCH UNLESS BLOCKER** (from Phase 0 + release judgment):

| Zone | Path / artifact |
|------|-----------------|
| Tenant resolution & guards | `apps/web/lib/tenant/**` |
| Middleware + lite allow list | `apps/web/middleware.ts`, `apps/web/lib/api/lite-allow-list.ts` |
| Supabase client factories | `apps/web/lib/supabase/**` — **surgical** fixes only when a gate proves Bearer/RLS bug |
| Upload session core | `apps/web/lib/domain/upload-session/**`, `apps/web/app/api/v1/media/upload-sessions/**` |
| Worker report core routes | `apps/web/app/api/v1/worker/**` (change only with gate-backed defect) |
| Stripe webhook ingress | `apps/web/app/api/v1/billing/webhooks/stripe/route.ts` and related idempotency |

---

## J. Release 1 definition of done

R1 is **done** when **all** hold:

1. **All nine surfaces** exist as shippable artifacts (two **new** Client apps built and named in repo).  
2. **F1–F10** are demonstrable end-to-end on **production** (or production-like) with **role-appropriate** users — **without** relying on **Android debug photo bypass** for the **reference proof**.  
3. **Web**: Admin **strip**, Manager, Owner/Client paths meet §C functional minimums.  
4. **Mobile**: Worker and Manager meet §C minimums on **iOS and Android**; **video/voice/text note/tri-state** meet **§F completion or signed waiver**.  
5. **Client mobile**: thin clients meet §G.  
6. **Earnings light**: visible where specified in agreed read model (at minimum **web**; **mobile Worker** if in contract — currently **gap**).  
7. **AI assist**: only narrow routes; **no** ai-brain program expansion.  
8. **No-touch** zones respected unless blocker with written approval.  
9. **Regression**: CI + smoke tests agreed in `PHASE1_ACCEPTANCE_GATES.md` are **green**.  
10. **iOS/Android reproducible build** documented and passing (CI or release runbook).

---

**STOP.** Phase 1 documentation complete. **No product code changes** in this phase.
