# STAGE 4 — Cross-platform truth matrix

**Date:** 2026-03-25 (UTC)  

## Preconditions

| Check | Evidence |
|-------|----------|
| Production lite `GET /api/v1/projects` + `android_lite` | **200**, pilot project present |
| Pilot DB seed | `seed_pilot_project.mjs` |
| Maestro + JDK 17 | `/usr/local/opt/openjdk@17/...`, Maestro **2.3.0** |

## Runtime matrix — latest evidence

| Check | Evidence |
|-------|----------|
| **iOS Worker** → submit → report UUID | **Not proven** — draft created; **before/after** attach pipeline stayed **queued** on Simulator (**600s** wait; Submit button never appeared) |
| **iOS Manager** review | **Not run** |
| **Android Worker / Manager** | **Not run** (no device) |
| **Cross-platform** | **Not proven** |

## Notes

- **iOS Shared `Config`:** host `Info.plist` loaded from disk; **xcconfig**-escaped slashes (`\/`) normalized to `/` for valid `URL(string:)`.
- **iOS login automation:** Debug builds use **TextField** for password (Maestro); Release keeps **SecureField**.

## Blockers for matrix closure

1. Complete **upload/operation queue** on device or Simulator (or run **Android** Maestro against online emulator).
2. Run **Manager** pilot after a **submitted** report exists.
3. Capture **full report UUID** from UI or API after submit.
