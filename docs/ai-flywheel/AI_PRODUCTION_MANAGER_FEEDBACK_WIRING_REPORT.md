# AI Production Manager Feedback Wiring Report

**Date:** 2026-06-17  
**Sprint:** AI Flywheel Tail Closure

## Wired surfaces

### 1. Web — CopilotChatPanel (production)

| Item | Detail |
|------|--------|
| Component | `CopilotOptionalFeedback` inside collapsed `<details>` "Optional AI feedback" |
| Visibility | **All environments** when last assistant message has `requestId` |
| Required fields | **None** — score-only or optional correction |
| API | `POST /api/v1/ai/feedback` via `submitAiFeedback` |
| Preference pair | Sent only when correction textarea non-empty |
| Diagnostics | Remains dev/staging-only (unchanged) |

### 2. iOS Manager — ProjectCopilotChatView

| Item | Detail |
|------|--------|
| Shared helper | `ios/Shared/Sources/Shared/AiFeedbackSubmit.swift` |
| UI | Collapsed `DisclosureGroup` — optional correction + submit |
| runId | From SSE `done.request_id` |
| API | Same `POST /api/v1/ai/feedback` |
| x-client | `ios_manager` (not lite-restricted) |

## Unchanged / deferred

| Surface | Reason |
|---------|--------|
| AiActionPanel Edge | No `recordRun`; read-only |
| Intelligence / vision | No edit flow + no run record |
| Reports | Wrong domain |
| Android | Product scope deferred |

## Safety

- Flags default false; capture non-strict server-side
- Primary chat/send unchanged
- Feedback failure does not block copilot

## Tests

- Web: `submitAiFeedback.test.ts`, `route.test.ts`, `feedback.service.test.ts`, stream `recordRun` test
- iOS: `xcodebuild -scheme AiStroykaManager` **pass** (2026-06-17)
