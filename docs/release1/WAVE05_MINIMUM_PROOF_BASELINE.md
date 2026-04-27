# Wave 0.5 — Minimum authoritative proof baseline (frozen for Wave 1 prep)

**Date:** 2026-03-26 (UTC)  
**Purpose:** Smallest set of checks that must stay **green** before/during Wave 1 **without** building a full QA platform.

---

## 1. Authoritative build commands

| Platform | Command | Pass criteria |
|----------|---------|---------------|
| **Web bundle (prod path)** | From repo root: `bun install --frozen-lockfile` then `bun run cf:build` | **CI `check` job** (per `.github/workflows/ci.yml`) |
| **iOS Simulator** | `scripts/ios/build-simulator.sh` | Both schemes **BUILD SUCCEEDED** |
| **Android Worker release (no bypass)** | `scripts/android/verify-worker-release-no-photo-bypass.sh` | **OK** line printed; `assembleRelease` success |
| **Android debug (optional Maestro)** | `./gradlew :AiStroykaWorker:assembleDebug` | Success — **not** R1 truth unless `-PpilotRealSubmit=true` or release |
| **Android Manager** | `./gradlew :AiStroykaManager:assembleDebug` | Success |

---

## 2. Authoritative smoke checks (operators)

| Check | Path / command | Notes |
|-------|----------------|-------|
| Pilot / auth smoke | `scripts/smoke/pilot_launch.sh` | Requires `SMOKE_*` / `AUTH_HEADER` per script docs |
| Prod health (optional) | `apps/web/scripts/smoke-prod.sh` | Env-dependent |

---

## 3. Authoritative automated tests (web)

| Suite | Command (dev machine) | File anchor |
|-------|-------------------------|-------------|
| Full web test run | `bun run test` or `npm run test` from `apps/web` | `package.json` |
| **Lite allow list** | `npx vitest run lib/api/lite-allow-list.test.ts --maxWorkers=1` | `apps/web/lib/api/lite-allow-list.test.ts` |

**Wave 0.5 gap:** These were **not** executed in the headless agent shell (no Node on PATH).

---

## 4. Authoritative CI checks (repo)

| Workflow | Role |
|----------|------|
| `.github/workflows/ci.yml` | PR: **lint**, **test**, **cf:build**, **e2e** smoke |
| `.github/workflows/deploy-cloudflare-prod.yml` | **main** production deploy |

**Gaps:** No **iOS** job, no **Android** job in root workflows.

---

## 5. Android Worker proof (R1 reference)

- **Authoritative:** **release** APK/AAB behavior OR debug with **`-PpilotRealSubmit=true`**.  
- **Non-authoritative for R1 truth:** default **debug** (photo bypass **on**).

---

## 6. Known remaining gaps (explicit)

1. **No** Kotlin unit tests in `android/**`.  
2. **No** automated iOS tests in CI.  
3. **Live** multi-role E2E (Admin/Manager/Worker/Owner) not scripted in Wave 0.5.  
4. `GET /api/v1/worker` stub (**501**) vs allow-list **allowed** — operational confusion only.

---

## 7. Wave 1 entry rule

Do not start Wave 1 **product** implementation until:

1. **G9** sign-off (or waiver doc) is recorded.  
2. **This baseline** is agreed by team lead.  
3. At least **one** full run of **CI** or local equivalent (`lint` + `test` + `cf:build`) on current `main`.
