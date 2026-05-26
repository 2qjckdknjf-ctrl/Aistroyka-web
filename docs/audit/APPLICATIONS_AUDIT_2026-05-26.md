# Applications Audit — 2026-05-26

## Scope

- Web app (`apps/web`)
- iOS Worker (`ios/AiStroykaWorker`)
- iOS Manager (`ios/AiStroykaManager`)
- Android Worker (`android/AiStroykaWorker`)
- Android Manager (`android/AiStroykaManager`)
- Production API health endpoints (`aistroyka.ai`, `www.aistroyka.ai`)

## Validation Run

### Web

- `bun run --cwd apps/web tsc --noEmit` — PASS
- `bun run --cwd apps/web lint` — PASS

### Android

- `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` — PASS
- Note: warning about Android Gradle Plugin `7.4.2` with `compileSdk = 34` (build still successful)

### iOS

- `xcodebuild -list -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` — PASS
- `xcodebuild -list -project ios/AiStroykaManager/AiStroykaManager.xcodeproj` — PASS
- `xcodebuild -scheme AiStroykaWorker -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build` — PASS
- `xcodebuild -scheme AiStroykaManager -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build` — PASS

### API / Runtime

- `curl -i https://aistroyka.ai/api/v1/health` — HTTP 200
- `curl -i https://www.aistroyka.ai/api/v1/health` — HTTP 200
- Health payload confirms: `ok=true`, `db=ok`, `supabaseReachable=true`, `serviceRoleConfigured=true`

## Findings

### High Priority (P0)

- None observed in this audit cycle (all target builds and health checks passed)

### Medium Priority (P1)

- ~~Android toolchain drift risk: AGP `7.4.2` is older than recommended for `compileSdk 34`~~ **Resolved 2026-05-26:** upgraded to AGP `8.2.2`, Java/Kotlin target `17`, explicit `buildConfig` for app modules.

### Low Priority (P2)

- ~~`next lint` deprecation notice in Next.js stack~~ **Resolved 2026-05-26:** migrated to ESLint CLI (`eslint app components lib middleware.ts --quiet`) with `root: true` in `apps/web/.eslintrc.json` so monorepo lint no longer no-ops via root ignore patterns.

## Readiness Snapshot

- Web build/type/lint: READY
- iOS Worker Debug build: READY
- iOS Manager Debug build: READY
- Android Worker Debug build: READY
- Android Manager Debug build: READY
- Production health endpoint status: READY

## Recommended Next Actions

1. ~~Plan Android Gradle Plugin upgrade path for `compileSdk 34+` compatibility hardening.~~ Done (AGP 8.2.2).
2. ~~Migrate lint command from `next lint` to ESLint CLI in planned Next.js maintenance batch.~~ Done.
3. Run targeted E2E smoke (`worker -> manager report lifecycle`) after any API/auth/security changes.
