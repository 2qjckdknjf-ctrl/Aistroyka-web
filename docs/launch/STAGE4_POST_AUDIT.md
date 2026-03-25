# STAGE 4 — Post-audit

**Latest (2026-03-25):** **Maestro** runs with **Homebrew OpenJDK 17**. **iOS Worker** Maestro: **login** (if needed) → **project picker** → **New report** → **Create report** → **photo pickers**; **submit** **not** completed — attach ops remained **queued** (**600s** max wait). **Android** Maestro **not** run (no emulator). **STAGE 4 OPEN** — no **submitted** report UUID + **Manager** review evidence.

## A. PILOT VALIDATION TRUTH

| Item | Detail |
|------|--------|
| **Maestro + JDK** | **PASS** — `JAVA_HOME`/`MAESTRO_JAVA_HOME` → OpenJDK **17.0.18** |
| **iOS Worker contour** | **PARTIAL** — draft + queued uploads; **no** submit |
| **iOS Manager** | **NOT RUN** |
| **Android** | **NOT RUN** |
| **Cross-platform IDs** | **Not captured** |

## B. FAILURES AND FIXES

| Issue | Mitigation |
|-------|------------|
| **Maestro** required JDK **17+** | Use `/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home` |
| **iOS `Config`** empty Supabase URL | Load **Info.plist** from host `.app` by walking paths; normalize `\/` → `/` |
| **Maestro + SecureField** | **DEBUG** only: `TextField` for password in `LoginView` |
| **Multi-project** home | Maestro: optional tap **“STAGE4 Pilot Project”** after login |
| **Photo pipeline stuck queued** | Simulator/runtime — **not** resolved in-session; needs device tuning or longer investigation |

## C. STAGE 4 DECISION

| Question | Answer |
|----------|--------|
| **STAGE 4 closed** | **NO** |
| **STAGE 5** | **Not revisited** |

## D. FILES

| Path | Note |
|------|------|
| `ios/Shared/Sources/Shared/Config.swift` | Host Info.plist + slash normalization |
| `ios/AiStroykaWorker/.../LoginView.swift` | DEBUG TextField password for Maestro |
| `maestro/flows/ios_worker_pilot.yaml` | Conditional login, project tap, long submit wait |
| `docs/launch/STAGE4_*.md` | This audit |
