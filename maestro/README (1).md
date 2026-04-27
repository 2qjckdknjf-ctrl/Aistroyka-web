# Maestro — STAGE 4 runtime pilot (minimal)

**Purpose:** Drive the four mobile surfaces with [Maestro](https://maestro.mobile.dev/) for **evidence** (report IDs, review actions), not a full QA framework.

## Prerequisites

1. **Java 17+** on `PATH` (Maestro 2.x). On macOS with Homebrew: `brew install openjdk@17`, then e.g.  
   `export JAVA_HOME="$(/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home)"`  
   (Apple Silicon: `/opt/homebrew/opt/openjdk@17/...`).  
   You can also point `MAESTRO_JAVA_HOME` at any JDK 17+ install (see `scripts/maestro/run_stage4_pilot.sh`).
2. **Maestro CLI** on `PATH`: `export PATH="$PATH:$HOME/.maestro/bin"` (after the official installer).
3. **Credentials** in repo root **`.env.local`** (gitignored): `SMOKE_EMAIL`, `SMOKE_PASSWORD` (same tenant user used for `scripts/smoke/pilot_launch.sh`). Do **not** commit secrets.
4. **Android:** emulator or device with debug APKs installed (`ai.aistroyka.worker`, `ai.aistroyka.manager`). Optional: `export MAESTRO_ANDROID_DEVICE_ID=emulator-5554`.
5. **iOS:** Simulator booted; `.app` built and installed for `ai.aistroyka.worker` / `ai.aistroyka.manager`.

## Run (from repo root)

```bash
chmod +x scripts/maestro/run_stage4_pilot.sh
./scripts/maestro/run_stage4_pilot.sh
```

Or individual flows:

```bash
set -a && source .env.local && set +a
export PATH="$PATH:$HOME/.maestro/bin"
export JAVA_HOME="…"   # JDK 17
maestro test maestro/flows/android_worker_pilot.yaml \
  -e SMOKE_EMAIL="$SMOKE_EMAIL" \
  -e SMOKE_PASSWORD="$SMOKE_PASSWORD"
```

**Credentials:** `maestro test` does **not** expand `${SMOKE_*}` from your shell unless you pass `-e` (see above). iOS flows also need `-p ios --udid <simulator-uuid>` when multiple devices are connected.

## Known limits (honest)

- **Compose `inputText` + focus:** On Android, `password` must not be typed into the still-focused email field. Flows use **`hideKeyboard` after the email field and after the password field** before Sign in, so the next `inputText` targets the correct field.
- **Compose test tags + Maestro:** Pilot `id:` selectors use `Modifier.semantics { testTagsAsResourceId = true }.testTag("…")` (see `pilotAutomatorTag` in `WorkerApp.kt` / `ManagerApp.kt`). Material `Button` did not reliably expose tags; login uses **Row + clickable** for the Sign-in row.
- **Android Photo Picker / iOS image picker:** After `addMedia`, flows use optional taps on known system resource IDs / labels (Maestro gallery recipe). If your emulator/OS differs, extend `android_worker_pilot.yaml` / `ios_worker_pilot.yaml` with the selectors that match your device. Do not claim PASS for the full contour without log/screenshot evidence.
- **Tenant data:** **Worker** needs a non-empty project list from `WorkerApi.projects()` (backed by `project_members` for the signed-in user). Minimal pilot seed: `scripts/smoke/seed_pilot_project.mjs` (service role; upserts one `projects` row + `project_members` for `SMOKE_EMAIL` on the pilot tenant). **Manager** `runFlow` for a report row is **skipped** when the inbox is empty; run **Worker** submit first, then Manager.
- **Lite client + production:** Worker sends `x-client: android_lite`. Middleware must allow **`GET /api/v1/projects` only** (not `POST`) — see `apps/web/lib/api/lite-allow-list.ts`. After deploying that change, verify before Maestro:  
  `curl -sS -H "Authorization: Bearer <user_jwt>" -H "x-client: android_lite" "https://www.aistroyka.ai/api/v1/projects"` → **200** with at least one project.
- **Manager review:** Approve/Reject only appear when report status is **submitted**. Run **Worker** submit first, then **Manager** (order enforced in `run_stage4_pilot.sh`).
- **Compose / SwiftUI:** Flows use `testTag` / `accessibilityIdentifier` values prefixed with `pilot_` (see Android `WorkerApp.kt` / `ManagerApp.kt` and iOS `LoginView`, etc.).

## Assets

- `maestro/assets/pilot.png` — tiny PNG used with Maestro `addMedia` to seed the device gallery when supported.
