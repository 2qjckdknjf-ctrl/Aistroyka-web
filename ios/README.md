# iOS — AiStroyka Manager & Worker

Two separate apps and a shared layer.

- **AiStroykaManager** — `ios/AiStroykaManager/AiStroykaManager.xcodeproj` — Manager app (dashboard, projects, tasks, reports, team, AI).
- **AiStroykaWorker** — `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` — Worker app (tasks, report, photo, offline sync).
- **Shared** — `ios/Shared/` — Swift package used by both apps (add as local package dependency).

Open either `.xcodeproj` in Xcode. Set Development Team for signing. To use Shared: File → Add Package Dependencies → Add Local → select `ios/Shared`.

## CI (simulator UITest smoke)

Pull requests that change files under `ios/` (except **`ios/**/*.md` only** — then this job is skipped) run **AiStroykaWorker** and **AiStroykaManager** login-surface UITests on GitHub Actions (`.github/workflows/ios-ui-smoke.yml`). **workflow_dispatch** always runs on demand. Tests use ad-hoc simulator signing; no production API calls.

**Scripts** (same Simulator pick logic as CI):

- `ios/scripts/ci-pick-iphone-simulator-udid.sh` — prints a UDID for `xcodebuild -destination "id=..."`. Prefers simulators whose **device name** starts with `iPhone` (skips renamed entries such as "HiAir Fresh iPhone 15" so logs don’t look like the wrong product; the built app is still the Xcode scheme).
- `ios/scripts/run-ios-uitest-smoke-local.sh` — runs both UITest smoke targets (uses your Xcode signing). To mimic CI signing:  
  `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh`

See also `docs/runbooks/MOBILE_OFFLINE_QUEUE.md` (Worker offline queue vs sync). Staging/pilot checklists: `docs/mobile-ios/manual-smoke/`.
