# Local Development Environment Audit — AISTROYKA

> Stage C of the Project Operating System setup. Probed local tools (read-only). No installs, no global state changes.
> Date: 2026-06-30 · Host OS: macOS (darwin 25.5.0, Apple Silicon)

## 1. Toolchain detected

| Tool | Required / expected | Detected | Status |
|---|---|---|---|
| Bun | 1.2.15 (`.tool-versions`) | **1.2.15** | OK (canonical) |
| Node | 22.9.0 pin | **22.23.0** | OK (≥ pin) |
| npm | (Vercel preview path) | 10.9.8 | OK |
| pnpm | workspace file present | not installed | Not needed (Bun is canonical) |
| git | — | 2.50.1 (Apple Git-155) | OK |
| Wrangler | ^4.67 | 4.69.0 (via `bunx`) | OK |
| Supabase CLI | for migration list/diff | **MISSING** | Blocker for DB CLI ops (see Stage D) |
| GitHub CLI | for PR ops | `/usr/local/bin/gh` not on PATH; **arm64 build present** at `~/.local/gh-arm64/gh_2.95.0_macOS_arm64/bin/gh` | OK via arm64 path |
| Xcode | iOS builds | **26.6** | OK |
| Java (JDK) | 17 for Android | **17.0.14** | OK |
| Android Gradle wrapper | — | `android/gradlew` present | OK |

> Reminder (AGENTS fact): if `/usr/local/bin/gh` ever errors with "bad CPU type", use the arm64 binary above.

## 2. Install / build / validate state

- Dependencies appear installed (`node_modules/` present, `bun.lock` committed).
- Canonical lock: root `bun.lock`. `package-lock.json` exists only for the Vercel npm preview path.

## 3. Exact commands — local setup

```bash
# From repo root
bun install --frozen-lockfile        # install with committed bun.lock
node scripts/ci/validate-npm-lock.cjs  # validate Vercel npm lock (CI parity)
```

## 4. Exact commands — local validation (safe, no secrets, no deploy)

```bash
# Web (mirrors CI Check order)
bun run i18n:check                      # i18n message parity (dashboard/activation scope)
bun run lint                            # ESLint over app components lib middleware.ts
bunx --cwd apps/web tsc --noEmit        # typecheck (run inside apps/web)
bun run test                            # builds contracts + runs apps/web unit tests
bun run cf:build                        # OpenNext/Workers bundle (NO deploy)
```

> `cf:build` requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` at build time (inlined into client bundle). CI supplies staging values. Locally these may be sourced from `apps/web/.env.local` (gitignored).
> **Do not** run `bun run build` and `bun run cf:build` in parallel — concurrent Next/OpenNext work can corrupt `apps/web/.next`.

### Mobile (only on macOS with Xcode / Android SDK)
```bash
# iOS UITest smoke (simulator)
ios/scripts/run-ios-uitest-smoke-local.sh
# Android build
cd android && ./gradlew assembleDebug
```

## 5. Known blockers (local)

| Blocker | Impact | Required action |
|---|---|---|
| Supabase CLI missing | Cannot run `supabase migration list` / `db diff` / push locally | Install Supabase CLI (`brew install supabase/tap/supabase`) — owner/operator decision; not auto-installed here. MCP Supabase tools remain available as an alternative. |
| `cf:build` needs `NEXT_PUBLIC_*` | Build fails without them | Ensure `apps/web/.env.local` has the three vars (gitignored). |
| `gh` not on default PATH | PR ops via default `gh` fail | Use the arm64 binary path above. |
| Android SDK presence not verified | Gradle build may need SDK/platform 35 | Verify `android/local.properties` `sdk.dir`; install platform 35 if building. |

## 6. What works locally right now

- Web install, lint, typecheck, unit tests, and `cf:build` (with env) — full PR-parity validation.
- iOS builds/UITests (Xcode 26.6 present).
- Android builds (JDK 17 + Gradle wrapper present; pending SDK verification).
- Git + Wrangler + GitHub CLI (arm64) available.
