# STAGE 3 — Unified core validation (canonical repo closure)

**Canonical repo:** `/Users/alex/Projects/AISTROYKA`  
**Closure pass date:** 2026-03-24  
**Worktree source for file sync:** `/Users/alex/.cursor/worktrees/AISTROYKA/kln` (STAGE 3 hardening landed there first; integrated into canonical via `cp` of the STAGE 3 file set — no `git merge` required for this pass).

## Package manager / web build truth

- Root `package.json` declares **`packageManager`: `bun@1.2.15`** and scripts `build:bun` / `build` (npm-oriented contracts path).
- **`bun run build:bun`** from root currently fails if **`npm` is not installed**, because `apps/web` **`prebuild`** runs `npm run build:contracts:npm`. This is a tooling gap, not a STAGE 3 product defect.
- **Validated production web build** (contracts + Next.js, typecheck + lint during build): use **Bun** for contracts, then **Next** without running `apps/web`'s npm-based `prebuild`:

```bash
export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd /Users/alex/Projects/AISTROYKA/packages/contracts && bun run clean && bun run build
cd /Users/alex/Projects/AISTROYKA/apps/web && NODE_ENV=production bunx next build
```

- **When `npm` is available**, the repo-standard one-liner remains: `npm install && npm run build` from repo root (per root `package.json`).

**Web result (2026-03-24, canonical):** **PASS** — Next.js reported `Compiled successfully`, lint/typecheck phase completed, static generation finished.

## Android (canonical)

**Commands:**

```bash
cd /Users/alex/Projects/AISTROYKA/android
./gradlew :AiStroykaWorker:assembleDebug --no-daemon
./gradlew :AiStroykaManager:assembleDebug --no-daemon
```

**Result (2026-03-24):** **PASS** — `BUILD SUCCESSFUL` for both (also succeeded in a single invocation `:AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug`).

## iOS (canonical)

**Tooling:** Xcode 15.2 (`xcodebuild`).

**Commands (Debug, iOS Simulator, signing disabled for compile-only proof):**

```bash
DEST='generic/platform=iOS Simulator'

xcodebuild -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj \
  -scheme AiStroykaWorker -configuration Debug -destination "$DEST" \
  build CODE_SIGNING_ALLOWED=NO

xcodebuild -project ios/AiStroykaManager/AiStroykaManager.xcodeproj \
  -scheme AiStroykaManager -configuration Debug -destination "$DEST" \
  build CODE_SIGNING_ALLOWED=NO
```

**Result (2026-03-24):** **PASS** — both ended with `** BUILD SUCCEEDED **`.

> Device signing / archive flows are out of scope for this closure pass; simulator compile validates STAGE 3 Swift changes.

## Backend / API

No STAGE 3 code changes to Next routes in the closure pass. Authoritative review contract remains `PATCH /api/v1/reports/:id` (`approved` | `rejected` | `changes_requested`).

## Pilot regression checklist (manual)

1. Android Worker: login → create report → photo → finalize → submit.  
2. Android Manager: reports → submitted report → media/AI → approve / reject / request changes.  
3. iOS Manager: same as (2).  
4. iOS Worker: `ios_lite` + worker routes only.
