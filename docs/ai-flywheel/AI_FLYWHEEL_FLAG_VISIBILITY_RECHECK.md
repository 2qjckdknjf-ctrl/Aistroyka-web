# AI Flywheel Flag Visibility Recheck

**Date:** 2026-06-17  
**Sprint:** Final owner-strict recheck

## A1 — Does optional feedback UI render when flags are false?

| Condition | Web (`CopilotChatPanel`) | iOS (`ProjectCopilotChatView`) |
|-----------|--------------------------|--------------------------------|
| `AI_FLYWHEEL_ENABLED=false` | **NO** | **NO** |
| `AI_FEEDBACK_CAPTURE_ENABLED=false` | **NO** | **NO** |
| Production env (default flags) | **NO** | **NO** |
| Staging env (default flags) | **NO** | **NO** |
| Dev env (default flags) | **NO** | **NO** |
| Both flags true (server) + iOS plist opt-in | **YES** (collapsed optional) | **YES** (collapsed optional) |

## Implementation

### Web

- Gate: `isAiFeedbackCaptureUiEnabled()` in `lib/platform/ai-flywheel/feedback-ui-gate.ts`
- Delegates to `isAiFeedbackCaptureEnabled()` (requires master + sub-flag)
- Client bundle: non-`NEXT_PUBLIC` env vars are empty → **false by default**
- `CopilotChatPanel` renders optional feedback only when gate is true

### iOS

- Gate: `AiFlywheelConfig.isFeedbackCaptureUiEnabled` (default **false**)
- Opt-in via `Info.plist` key `AI_FEEDBACK_CAPTURE_UI_ENABLED` or process env (pilot only)

## Prior issue (fixed)

Tail closure initially showed optional feedback in **production without flag check** — **production UX change when flags false**. Fixed in this recheck.

## Diagnostics block

Web copilot **Diagnostics** `<details>` remains `IS_DEV_OR_STAGING` only — separate from feedback UI.

## Tests

- `lib/platform/ai-flywheel/feedback-ui-gate.test.ts`
- `behavior-safety.test.ts` — CopilotChatPanel gate assertion
- Flags false → gate false; flags true → gate true

## Verdict

| Question | Answer |
|----------|--------|
| Intended to show when flags false? | **NO** |
| Was production UX change? | **YES (fixed)** |
| Hidden behind flags now? | **YES** |
