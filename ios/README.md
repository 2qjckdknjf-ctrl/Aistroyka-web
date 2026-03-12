# iOS — AiStroyka Manager & Worker

Two separate apps and a shared layer.

- **AiStroykaManager** — `ios/AiStroykaManager/AiStroykaManager.xcodeproj` — Manager app (dashboard, projects, tasks, reports, team, AI).
- **AiStroykaWorker** — `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` — Worker app (tasks, report, photo, offline sync).
- **Shared** — `ios/Shared/` — Swift package used by both apps (add as local package dependency).

Open either `.xcodeproj` in Xcode. Set Development Team for signing. To use Shared: File → Add Package Dependencies → Add Local → select `ios/Shared`.
