# iOS Project, Schemes, Targets

## Toolchain

- Xcode: **26.6** (Build 17F113)
- `xcrun`: available at `/usr/bin/xcrun`

## Projects

| Project | Path |
|---|---|
| AiStroykaManager | `ios/AiStroykaManager/AiStroykaManager.xcodeproj` |
| AiStroykaWorker | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` |

Shared logic: `ios/Shared` (local SwiftPM package, resolved in both projects).

## Targets / Schemes

| Project | Targets | Schemes |
|---|---|---|
| AiStroykaManager | `AiStroykaManager`, `AiStroykaManagerUITests` | `AiStroykaManager`, `Shared` |
| AiStroykaWorker | `AiStroykaWorker`, `AiStroykaWorkerUITests` | `AiStroykaWorker`, `Shared` |

Build configurations: `Debug`, `Release` (both projects).

## Bundle identifiers (resolved, Release scheme)

| App | Bundle ID | UITest bundle ID |
|---|---|---|
| Manager | `ai.aistroyka.manager` | `ai.aistroyka.manager.uitests` |
| Worker | `ai.aistroyka.worker` | `ai.aistroyka.worker.uitests` |

## Versions

| App | MARKETING_VERSION | CURRENT_PROJECT_VERSION |
|---|---|---|
| Manager | `1.0.0` | `1` |
| Worker | `1.0.0` | `1` |

Both apps carry `CFBundleShortVersionString` + `CFBundleVersion` in Info.plist.

Note: marketing version `1.0.0` / build `1` is the initial value; for repeated TestFlight uploads the build number must be incremented per upload (owner/CI action, not a structural blocker).
