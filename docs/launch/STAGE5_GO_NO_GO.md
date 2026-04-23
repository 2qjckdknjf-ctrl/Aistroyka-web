# STAGE 5 — GO / NO-GO

**Status:** **DRAFT — NOT FINAL.** Do not treat as release authority until **STAGE 4 is closed** with runtime evidence.

**Date:** 2026-03-24  
**Decision (draft):** **NO-GO** for first-client launch closure in the sense of “stages 0–5 complete with runtime proof.”

## Why NO-GO

| Criterion | Result |
|-----------|--------|
| Authenticated `pilot_launch` + `ops/metrics` **200** | **Not proven** — `SMOKE_EMAIL` / `SMOKE_PASSWORD` and `SUPABASE_SERVICE_ROLE_KEY` **absent** from shell and from committed local env files; only `NEXT_PUBLIC_SUPABASE_*` in repo root `.env.local`. `apps/web/.env.local` contains **Supabase CLI PAT** (`sbp_…`), **invalid** for tenant API Bearer. |
| Android Worker full contour | **Not proven** — emulator **Nexus_6_API_R** (emulator-5554): APKs **install Success**, `am start` **OK**; **no** login / report / submit evidence (no pilot credentials). |
| iOS Worker full contour | **Not proven** — iPhone 15 simulator: app **install + launch** (`ai.aistroyka.worker` PID returned); **no** end-to-end contour evidence. |
| Android Manager | Same as Worker — **no** review evidence. |
| iOS Manager | **Not** installed/launched in this session — partial iOS effort focused on Worker; **no** Manager contour evidence. |
| Cross-platform report IDs + review | **None** |

## What was resolved locally

- **Android P0 config bug:** `SUPABASE_URL` / `SUPABASE_ANON_KEY` were **empty `BuildConfig`** — fixed by loading **`android/local.properties`** (gitignored) and populating from `.env.local` for this machine. Gradle **assembleDebug** succeeds; apps install on emulator.
- **Emulator / simulator:** Android emulator **started**; iOS Simulator **booted**; installs **succeeded** where attempted.

## What remains (external / operator)

1. Add **`SMOKE_EMAIL` + `SMOKE_PASSWORD`** (tenant user) to env **or** export **`AUTH_HEADER="Bearer <user_jwt>"`** or **`COOKIE`** from browser session — then rerun `pilot_launch.sh` until **exit 0**.
2. Optionally **`SUPABASE_SERVICE_ROLE_KEY`** + `node scripts/smoke/bootstrap_smoke_user.mjs` for one-time user (admin-only).
3. Run **manual** pilot on all four surfaces; record **report UUIDs** and **review states** in `STAGE4_*` docs.

## STAGE 5 pack status

| Artifact | Status |
|----------|--------|
| `STAGE5_LAUNCH_CHECKLIST.md` | Created (blocked preconditions) |
| `STAGE5_KNOWN_LIMITATIONS.md` | Created |
| This GO/NO-GO | **NO-GO** |

**STAGE 5 “content” exists; launch readiness is NO-GO until STAGE 4 closes.**
