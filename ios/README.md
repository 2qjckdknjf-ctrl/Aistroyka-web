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
- `ios/scripts/run-ios-e2e-integration-local.sh` — **Layer B** live pilot UITests (Worker report draft; Manager reports inbox + project intelligence + copilot screens). Requires `ios/Config/Secrets.xcconfig` and `SMOKE_EMAIL`/`SMOKE_PASSWORD` in repo-root `.env.pilot` (or `IOS_E2E_*` exports). Writes gitignored `ios/Config/.uitest-e2e-credentials` for the UITest runner (template: `ios/Shared/Sources/Shared/e2e-credentials.env.example`; never commit `e2e-credentials.env`). Auto-pins `IOS_E2E_PROJECT_ID` from production API when unset (`IOS_E2E_BASE_URL` defaults to `https://aistroyka.ai`, not local `NEXT_PUBLIC_APP_URL`). Optional: `CI_SIGNING_HACK=1`, `IOS_E2E_ONLY_TEST`, `IOS_E2E_SKIP_WORKER=1`.
- **CI (manual):** `.github/workflows/ios-e2e-integration.yml` — `workflow_dispatch` runs API chain + Layer B UITests on `macos-latest` when `PILOT_E2E_*` and production Supabase secrets are configured.

See also `docs/runbooks/MOBILE_OFFLINE_QUEUE.md` (Worker offline queue vs sync). Staging/pilot checklists: `docs/mobile-ios/manual-smoke/`.

**Manager AI:** `docs/ai/IOS_MANAGER_AI_PARITY_MATRIX.md` — per-project **Intelligence** (`GET .../intelligence`) and **Copilot** SSE (`POST .../copilot/chat/stream`); AI tab lists `GET /api/v1/ai/requests`. Live LLM proof remains `scripts/smoke/ai_live_provider.sh --require-live` on web.
