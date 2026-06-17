# AI iOS Feedback Surface Audit

**Date:** 2026-06-17  
**Sprint:** AI Flywheel Tail Closure

## Classification key

| Class | Meaning |
|-------|---------|
| **A** | No AI feedback surface |
| **B** | AI UI but no preference-pair data |
| **C** | Safe to wire optional preference fields |

---

## Summary

| App | `/api/v1/ai/feedback` before sprint | After sprint |
|-----|-------------------------------------|--------------|
| AiStroykaManager | None | **Optional** via `ProjectCopilotChatView` |
| AiStroykaWorker | None | None (Class A) |
| Shared | None | `AiFeedbackSubmit.swift` |

---

## AiStroykaManager surfaces

| Surface | Class | Evidence |
|---------|-------|----------|
| `ProjectCopilotChatView` | **C → wired** | SSE provides `requestId`, `finalText`, user question |
| `ProjectIntelligenceView` | **B** | Read-only GET intelligence |
| `AITabView` | **B** | Job ledger, no output text |
| `ProjectAIView` | **B** | Status rows only |
| `ReportDetailReviewView` | **B / Skip** | Human report PATCH, not AI |
| Help assistant | **B / Skip** | Onboarding guide, wrong API |
| Vision analyze | **A** | Not implemented on iOS |

---

## AiStroykaWorker

| Surface | Class |
|---------|-------|
| All | **A** — no copilot, no AI feedback API |

"Manager feedback" section = human `changes_requested` reports, not AI.

---

## Implementation (tail closure)

- `ios/Shared/Sources/Shared/AiFeedbackSubmit.swift` — POST helper + `preferenceFields()`
- `ProjectCopilotChatView` — optional collapsed feedback; retains `requestId` from `.done`
- Localizations: en/ru/es/it `mgr_copilot_*_feedback*` keys

## Build evidence

```bash
xcodebuild -scheme AiStroykaManager -destination 'generic/platform=iOS Simulator' build
```

**Result:** exit 0 (2026-06-17). Warnings only (pre-existing MainActor patterns in stream callback).

`swift build` in Shared alone **fails** on macOS default target (NetworkMonitor iOS-only APIs) — use Xcode iOS Simulator build.

---

## Verdict

| Question | Answer |
|----------|--------|
| Audited | **YES** |
| Wiring needed | **YES** (Manager copilot only) |
| Implemented | **YES** |
| Worker scope | **None** |
