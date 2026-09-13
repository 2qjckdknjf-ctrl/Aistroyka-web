# AI iOS Feedback Recheck

**Date:** 2026-06-17

## Flag visibility

| Condition | Optional feedback UI |
|-----------|---------------------|
| Default (no plist override) | **Hidden** |
| `AI_FEEDBACK_CAPTURE_UI_ENABLED=true` in Info.plist or env | Shown (collapsed `DisclosureGroup`) |

Gate: `AiFlywheelConfig.isFeedbackCaptureUiEnabled` in `ios/Shared/Sources/Shared/AiFlywheelConfig.swift`

## Safety checks

| Check | Verdict |
|-------|---------|
| No required fields | YES |
| Old copilot send flow unchanged | YES |
| `AiFeedbackSubmit.preferenceFields` null without correction | YES — score-only path |
| Incomplete correction skipped for pair | YES — pair only when correction non-empty |
| Finance/PII in payload | NO — text + question only; server scrubs on capture |

## Build

```bash
xcodebuild -scheme AiStroykaManager -destination 'generic/platform=iOS Simulator' build
```

**Result:** exit 0 (2026-06-17 recheck)

## MainActor warnings

Swift compiler warnings in stream callback mutating `@State messages` from nested `Task` — **pre-existing pattern**, same as before feedback wiring. Classified **P3**, not a safety blocker.

## Worker app

No feedback UI — unchanged.

## Verdict

**Safe and build-verified:** **YES**  
**Hidden when flags/config false:** **YES**
