# Mobile Branch Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Primary Mobile / Release Branches

|Branch|SHA|Ahead / behind PR #109|Files|iOS|Android|API|Tests|Docs|Classification|Direct merge|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
|`release/mobile-pilot-rc`|`4da009429a85`|12 / 24|285|90|92|6|9|71|Primary mobile pilot reference; broad mixed branch.|NO|
|`origin/cursor/android-platform-launch-b8bb`|`1ae0b23dca39`|4 / 577|101|0|89|0|0|12|Android launch/reference branch; far behind baseline.|NO|
|`origin/release/publication-readiness-mega-sprint`|`c66174190f24`|26 / 90|97|11|4|23|4|10|Publication/release branch with API and mobile touches.|NO|
|`origin/release/web-pilot-rc`|`9d6a7812d57c`|23 / 24|269|0|0|0|7|81|Web/design reference, not mobile source.|NO|
|`design/liquid-glass-public-shell-lg2a`|`68be705af313`|38 / 29|349|7|0|10|36|170|Design branch with small iOS and API spillover.|NO|

## Small iOS / Pilot Fix Branches

|Branch|SHA|Summary|Classification|Direct merge|
|---|---:|---|---|---|
|`origin/fix/ios-e2e-workflow-push-phantom`|`773ba8e2db94`|2 ahead / 43 behind; workflow/docs/scripts only with one iOS doc path.|Reference only; likely superseded by current workflows.|NO|
|`fix/ios-e2e-ci-secrets`|`c2db93f5ad44`|1 ahead / 39 behind; docs/workflow secret handling.|Reference only.|NO|
|`fix/ios-e2e-phantom-push`|`23b8b17d47bb`|1 ahead / 41 behind; docs/workflow noise.|Reference only.|NO|
|`docs/ios-e2e-ci-pass`|`6ea2d9947238`|1 ahead / 37 behind; docs-only E2E evidence.|Evidence reference only.|NO|

## Superseded / Contained Branches

These have no diff against PR #109 for mobile/API purposes and should not drive future work:

- `mobile/worker-lite-finalization`
- `ops/pilot-finalization`
- `release/pilot-hardening-max`
- `release/pilot-launch-pack`
- `audit/release-readiness-max`
- `origin/release/phase5-2-1`
- `origin/release/cloudflare-agent-starter-split`
- `origin/fix/pilot-smoke-prefer-user-jwt`
- `origin/feat/manager-ai-parity-and-live-gates`

## Changed Path Themes in `release/mobile-pilot-rc`

`release/mobile-pilot-rc` touches:

- Android Manager and Worker app modules.
- Android shared API, DTOs, design system, operation queue, and tests.
- iOS Manager and Worker app code.
- iOS report/review/upload/runtime surfaces.
- Web report/export APIs and middleware.
- Playwright and manager review E2E.
- mobile readiness and mobile LG docs.

That scope is too broad for direct merge and overlaps PR #109 report-review/export hardening. Future mobile work must cherry-pick or reimplement tiny slices from current `main` after PR #109 lands.

## Inventory Verdict

Broad mobile merge safe now: NO.

Reason: relevant branches are mixed across mobile UI, Android design system, iOS runtime, web API, middleware, release docs, and stale historical baselines. They require manual extraction into small PRs after the PR #109 baseline merges.
