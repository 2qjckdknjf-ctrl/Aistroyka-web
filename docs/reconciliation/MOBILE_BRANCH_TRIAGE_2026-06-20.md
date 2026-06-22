# Mobile Branch Triage — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## release/mobile-pilot-rc

- Ref reviewed: `release/mobile-pilot-rc`
- Ahead/behind: 12 ahead, 0 behind
- Last commit: `4da00942` — 2026-06-20 — `android: wire release signing and build RC versionCode 2 AABs`
- Changed file count: 285
- Main changed areas: frontend, backend, AI, mobile, release/ops, docs, tests

## iOS Changes Outside Main
- iOS Liquid Glass redesign work for Manager and Worker is present in the branch history.
- iOS app icon/orientation/TestFlight fixes are present.
- iOS UI test and pilot release documentation appear in the branch.
- iOS files are present under `ios/`, including app-level assets/config/project-adjacent files and shared code.

## Android Changes Outside Main
- Android Manager and Worker Liquid Glass UI redesigns are present.
- Android release signing/build configuration is present, including Gradle build files and release versionCode/AAB work.
- Android `.gitignore` and example service account/secrets scaffolding are present.
- Key files include `android/AiStroykaManager/build.gradle.kts`, Manager/Worker Kotlin UI/navigation/foundation files, and Android release config surfaces.

## Backend/API and Web Changes
- Includes backend/API-adjacent and web changes too.
- Includes some AI/web surface changes, not purely mobile.
- Therefore it should not be integrated before backend/API and frontend/design decisions are stabilized.

## Safety Review
- Includes backend/API changes too: YES/PARTIAL.
- Includes web changes: YES.
- Safe to merge after backend/frontend: NOT AS A FULL MERGE.
- Should mobile be integrated later as separate group: YES.
- Touches signing/build configs: YES.
- Contains migrations: NO.
- Touches auth/tenant/security: YES/POSSIBLE through cross-module files and mobile auth/client behavior.

## Decision
- Risk: P0.
- Decision: `manual_review_again`.
- Integration method: separate mobile integration group after release/ops, database/contracts, backend/API, AI, and web/frontend compatibility decisions.
- Do not full-merge.
- Do not cherry-pick signing/build config until secrets handling and Android release pipeline are reviewed.

## Required Validation
- iOS build and UITest smoke.
- Android assemble/bundle checks without committing secrets.
- Mobile API compatibility against `/api/v1`.
- Login/session smoke for Manager and Worker.
- Pilot smoke with known test credentials only from gitignored config.
- Confirm no Manager/Worker product merge or WorkerLite naming regression.
