# STAGE 4 — Pilot validation report

**Canonical repo:** `/Users/alex/Projects/AISTROYKA`  
**Last validation session:** 2026-03-25 (UTC)  
**Rule:** No **PASS** without evidence.

**Auth + prep reference:** [`STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md`](STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md)

---

## Executive outcome

**STAGE 4 is NOT closed** as a **full** program: production **lite GET** is **verified**; **Maestro** now runs with **JDK 17** (`/usr/local/opt/openjdk@17/...`). **iOS Worker** Maestro reached **draft report + queued photo pipeline** but **did not** capture **submit + Manager review** in this session (upload operations remained **queued** on Simulator after **10+ min**; **Android** flows **not** run — **no** emulator online).

**Deploy (2026-03-25):**

| Step | Result |
|------|--------|
| **Path** | **GitHub Actions** `.github/workflows/deploy-cloudflare-prod.yml` — **push to `main`** → `bun run cf:build` → patched bundle → **Wrangler deploy** (`aistroyka-web-production`). |
| **Commits** | `4fea2727` — lite allow-list + `seed_pilot_project.mjs`; `f2201eed` — **add missing** `apps/web/lib/entry/*` (middleware import; CI build had failed with “Can't resolve `@/lib/entry/entry-routing`” until tracked). |
| **CI run** | `23534971283` — **Deploy to Cloudflare (production)** ✅; **Verify pilot smoke secret (production)** ❌ — `PILOT_SMOKE_BEARER_PRODUCTION` **empty or not configured** in repo secrets. |
| **Local Wrangler** | **Not used for prod** — `npm run cf:deploy:prod` failed here: Worker bundle exceeds **3 MiB** free-tier limit; CI uses production credentials. |

**Production verification (after deploy):**

| Check | Result |
|-------|--------|
| **`GET https://www.aistroyka.ai/api/v1/projects`** + smoke user **`Authorization: Bearer`** + **`x-client: android_lite`** | **200** — `data[].name` includes **“STAGE4 Pilot Project”**. |
| **Same without `x-client`** | **200** — same projects. |
| **`POST /api/v1/projects`** + **`x-client: android_lite`** | **403** `lite_client_path_forbidden` (expected). |
| **`GET /api/health`** | **`buildStamp.sha7`** = **`f2201ee`** (matches deployed commit prefix). |

**Tests / build (local):** `vitest` `lib/api/lite-allow-list.test.ts` — **13 passed**; `npm run cf:build` in `apps/web` — **success** before local deploy attempt.

**Maestro + iOS Worker (2026-03-25 follow-up):**

| Item | Result |
|------|--------|
| **JDK** | `JAVA_HOME` / `MAESTRO_JAVA_HOME` = `/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home` — **Maestro 2.3.0** runs |
| **iOS Worker flow** | **PARTIAL** — login (conditional), **STAGE4 Pilot Project** picker tap, **New report** → **Create report** → before/after **Choose from library**; **Submit report** **not** reached — UI showed **Before: queued** / **After: queued**; **`pilot_worker_submit_report`** **not** visible within **600s** wait |
| **Evidence** | Maestro debug: `maestro/output/ios_worker.log`; screenshot draft prefix **879DD187…** (full UUID not surfaced before timeout) |
| **iOS fixes applied** | `Shared/Config.swift` — load host **Info.plist** from disk + normalize `\/` in URLs from xcconfig; **DEBUG** `LoginView` uses **TextField** for password (Maestro cannot fill **SecureField** reliably on Simulator); `AuthService` trims Supabase URL |
| **Android Worker/Manager** | **Not executed** — `adb devices` empty (emulator not started / offline) |

**Prior session:** lite list + seed blockers resolved in production.

**Authenticated smoke:** **PASS** — `ops/metrics` **200**, **`pilot_launch.sh` exit 0** (after DB fix below).

### Root cause resolved (2026-03-25): `tenant_members` RLS recursion

**Symptom:** Valid Supabase user JWT + `tenant_members` row present, but `GET /api/v1/ops/metrics` returned **403** (`User has no tenant membership`) or clients saw **401** / auth failures when the app could not resolve tenant context.

**Cause:** `tenant_members` **SELECT** policy subqueried `tenant_members` inside its own `USING` clause → Postgres **`42P17` infinite recursion** on `tenant_members` (confirmed via REST with user JWT).

**Fix:** Applied migration logic from `apps/web/supabase/migrations/20260323110000_tenant_members_rls_break_recursion.sql` to the **remote** project (`SECURITY DEFINER` helper `current_user_tenant_ids()` + non-recursive policy).

**After fix:** User JWT can `SELECT` own `tenant_members` rows; **`pilot_launch.sh`** with `SMOKE_*` in `.env.local` → **PASS** health, config, cron-tick, **ops/metrics**, **exit 0**.

### Runtime pilot (2026-03-25) — four mobile surfaces

**Scope required:** Per STAGE 4 closure criteria: **login → worker context → create report → photo → upload/finalize → submit** on **Android Worker** and **iOS Worker**; **Manager** review on **Android** and **iOS**; **cross-platform** visibility + review state consistency.

**Result:** **PARTIAL** — **Maestro** harness added and **Android** flows **executed** against **emulator-5554** with **SMOKE_*** from `.env.local`.

**What was exercised (evidence):**

- **Maestro harness:** `maestro/` flows + `scripts/maestro/run_stage4_pilot.sh`; **JDK 17+** required for Maestro 2.x (`MAESTRO_JAVA_HOME` or Homebrew `openjdk@17`).
- **Android Worker (`android_worker_login_only.yaml` + `android_worker_pilot.yaml`):** **PASS** login → home with **“Projects”** visible; **FAIL** full pilot at **`pilot_worker_project_row_0`** — UI shows **“No projects returned. Pull to refresh after fixing membership.”** (no project rows; **no** report creation). **Root cause for contour gap:** **empty project list** for the smoke user/tenant in this environment, not Maestro login.
- **Android Manager (`android_manager_pilot.yaml`):** **PASS** login → **Reports inbox** → reports screen (**“Home”** in app bar); **conditional** block for **`pilot_manager_report_row_0`** **SKIPPED** (empty inbox → **no** report detail, **no** Approve tap).
- **iOS Worker / iOS Manager:** Flows `ios_worker_pilot.yaml` / `ios_manager_pilot.yaml` **not run** in this session (no fresh sim install + Maestro run logged).

**Authenticated smoke (prerequisite):** **GREEN** — `pilot_launch.sh` **exit 0**, `ops/metrics` **200** (see executive outcome + RLS fix above).

### Four-surface runtime pilot (STAGE 4 scope)

**Android:** **Maestro** exercised **Worker** (login + home) and **Manager** (login + reports screen). **Worker** did **not** reach create/submit (no projects). **Manager** did **not** open a report (no rows).  
**iOS:** **Not re-run** here with Maestro.  
**Cross-platform:** **Not proven** — no report ID created on device in this session to compare across surfaces.

---

## Phase A — Authenticated smoke (`scripts/smoke/pilot_launch.sh`)

### Auth paths supported (script behavior)

1. `AUTH_HEADER` = `Bearer <supabase_user_jwt>`
2. `COOKIE` = browser session cookie string
3. If both unset: `SMOKE_EMAIL` + `SMOKE_PASSWORD` + `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → password grant

### Commands run (evidence)

**Unauthenticated / no user JWT:**

```bash
cd /Users/alex/Projects/AISTROYKA
set -a && source .env.local && set +a
export BASE_URL=https://aistroyka.ai
unset AUTH_HEADER COOKIE SMOKE_EMAIL SMOKE_PASSWORD
bash ./scripts/smoke/pilot_launch.sh
```

**Result:** `PASS: health`, `PASS: config`, `PASS: cron-tick (no secret)`, `FAIL: ops/metrics → HTTP 401`, **exit 1**.

**Root `.env.local`:** contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only — **no** `SMOKE_EMAIL` / `SMOKE_PASSWORD`.  
**`apps/web/.env.local`:** `SUPABASE_ACCESS_TOKEN=sbp_…` — **CLI-style PAT**, not a user JWT (see [`STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md`](STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md)).

**Conclusion:** Cannot obtain **exit 0** without operator-supplied **tenant user** credentials or browser session. **Not a script defect** — missing secrets on this machine.

---

## Phase B — Runtime (four surfaces)

### Environment / tooling

| Item | Detail |
|------|--------|
| Android SDK | `~/Library/Android/sdk`; `adb` used via explicit `PATH` |
| Android emulator | **AVD `Nexus_6_API_R`**, id **emulator-5554**, API 30 |
| iOS Simulator | **iPhone 15**, UDID `F807605D-F0FA-45DA-961E-B1AC69A27A91` |

### Android — code fix (launch-critical)

**Issue:** `BuildConfig.SUPABASE_URL` and `SUPABASE_ANON_KEY` were **empty strings** → auth could not work.

**Fix:** Load from `android/local.properties` (gitignored) or env; populate from repo `.env.local` on this host via scripted append (keys not committed).

**Build:** `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` → **BUILD SUCCESSFUL**.

**Install (emulator):**

- `adb -s emulator-5554 install -r …/AiStroykaWorker-debug.apk` → **Success**
- `adb -s emulator-5554 install -r …/AiStroykaManager-debug.apk` → **Success**

**Launch:**

- `adb shell am start -n ai.aistroyka.worker/.MainActivity` → **Starting: Intent …**
- `adb shell am start -n ai.aistroyka.manager/.MainActivity` → **Starting: Intent …**

**Contour (login → report → submit → ID):** **NOT RUN** — blocked by **non-green** smoke / tenant membership for smoke account.

### iOS

**Install + launch (Worker):**

- `xcrun simctl install booted …/AiStroykaWorker.app` → **exit 0**
- `xcrun simctl launch booted ai.aistroyka.worker` → returned PID (e.g. **85334**)

**iOS Manager:** **Not** installed/launched in this validation pass (gap).

**Contour:** **NOT RUN** — tenant membership blocker; no report IDs.

### Cross-platform

**Not verified** — no report submissions.

---

## Screenshots / logs

- **Screenshots:** not captured (automation session).
- **Logs:** shell transcripts above; Android logcat filtered no app-specific **FATAL** in sampled tail post-launch.

---

## Operator table (still open)

| Field | Android Worker | iOS Worker | Android Manager | iOS Manager |
|-------|------------------|------------|-------------------|-------------|
| Report ID(s) | — (no project → no draft/report) | — | — (empty inbox) | — |
| Review outcome | — | — | — (no row tapped) | — |

---

## Related

- [`STAGE5_GO_NO_GO.md`](STAGE5_GO_NO_GO.md) — **NO-GO** pending STAGE 4.
