# 10/10 Master Audit

Updated: 2026-05-01

## Repository Reality

- Monorepo with primary app in `apps/web`.
- Workspace packages: `packages/contracts`, `packages/api-client`, `packages/contracts-openapi`.
- Mobile apps: native iOS (`ios/AiStroykaWorker`, `ios/AiStroykaManager`) and Android (`android/AiStroykaWorker`, `android/AiStroykaManager`, `android/shared`).
- Canonical API path remains `/api/v1/*`; legacy `/api/*` still exists as compatibility.

## Baseline Evidence

- `git status --short` clean.
- `git branch --show-current` => `feat/platform-owner-cabinet`.
- `git log -n 10 --oneline` shows recent stabilization commits, including migration hygiene and owner flows.
- API inventory script result: total 231 routes, 204 under `/api/v1`, 27 legacy, 4 system.
- Migration inventory script result: 99 files, duplicate timestamp groups: 0.

## High-Signal Findings

1. Validation baseline is green (typecheck/lint/test/build/cf:build).
2. iOS Worker and iOS Manager simulator builds succeed.
3. Android `assembleDebug` succeeds, but AGP 7.4.2 on compileSdk 34 warning remains (technical debt, not immediate blocker).
4. Supabase/Cloudflare live runtime verification remains externally blocked without operator secrets and remote access.

## Canonical Ownership

- API contracts: `packages/contracts`.
- Web/API runtime: `apps/web`.
- iOS shared logic: `ios/Shared`.
- Android shared logic: `android/shared`.

## Risk Snapshot

- P0: none detected in local scope.
- P1: external live verification gap (Supabase/Cloudflare runtime checks).
- P2: Android toolchain modernization (AGP/Gradle alignment).
