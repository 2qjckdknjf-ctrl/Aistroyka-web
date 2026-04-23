# STAGE 5 — Known limitations (honest)

**Status:** **DRAFT — NOT FINAL** until STAGE 4 closes.

**Context:** As of **2026-03-24**, STAGE 4 closure was **not** achieved on the canonical dev machine; this list reflects **repo + validation** truth, not a shipped launch.

## Launch / validation

- **Authenticated smoke** requires a **Supabase user JWT** (or session cookie) with **tenant membership** — not CLI PATs, not anon key alone.
- **Android** `BuildConfig` Supabase fields must be populated via **`android/local.properties`** (or env vars at Gradle time) — see `android/local.properties.example` and `AiStroykaWorker` / `AiStroykaManager` `build.gradle.kts`.

## Product (from scope lock / matrix)

- Worker **video** and **free-text comment** are **not** closed as cross-platform must-haves without additional work.
- Android parity vs iOS was historically weaker; recent Kotlin work improves this — **runtime** still must be proven per STAGE 4.

## Operations

- **Cron** may require `CRON_SECRET` when `REQUIRE_CRON_SECRET=true` in production.
- **First-client** pilot accounts and tenant data must exist in **production** Supabase — not assumed by repo scripts without `SUPABASE_SERVICE_ROLE_KEY` or operator credentials.
