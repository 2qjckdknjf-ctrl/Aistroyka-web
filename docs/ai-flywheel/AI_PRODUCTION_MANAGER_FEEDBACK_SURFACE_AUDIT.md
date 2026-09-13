# AI Production Manager Feedback Surface Audit

**Date:** 2026-06-17  
**Sprint:** AI Flywheel Tail Closure

## Method

Repo-wide search for `POST /api/v1/ai/feedback`, manager AI surfaces, `recordRun`, and edit/accept/reject flows.

---

## Executive summary

| Finding | Status |
|---------|--------|
| Production-safe surface with runId + original + optional correction | **Copilot stream chat** (`CopilotChatPanel` / iOS `ProjectCopilotChatView`) |
| Other manager AI surfaces | Read-only or missing `ai_run_records` linkage |
| Report approval / client portal | Wrong domain — not AI preference pairs |

---

## Candidate matrix

| Surface | Path | Role | Original output | Corrected output | task_type/audience | runId | Risk | Decision |
|---------|------|------|-----------------|------------------|-------------------|-------|------|----------|
| Copilot stream (web) | `lib/features/ai/components/CopilotChatPanel.tsx` | Manager | Yes (`lastAssistant.content`) | Optional textarea | `copilot` / `internal` | Yes (`requestId`) | Low | **Wire now** |
| Copilot stream (iOS) | `ios/.../ProjectCopilotChatView.swift` | Manager | Yes (SSE `finalText`) | Optional field | `copilot` / `internal` | Yes (`requestId`) | Low | **Wire now** |
| AiActionPanel Edge tabs | `components/ai/AiActionPanel.tsx` | Manager | Yes | No edit UI | Partial | Edge id only, no `recordRun` | Medium | **Defer** — no run record |
| CopilotSummaryPanel | `components/intelligence/CopilotSummaryPanel.tsx` | Manager | Yes | No | Partial | No `recordRun` | Medium | **Defer** |
| ProjectIntelligenceClient | `ProjectIntelligenceClient.tsx` | Manager | Mixed/heuristic | No | No | No | Medium | **Defer** |
| MediaAnalysisRow | `projects/MediaAnalysisRow.tsx` | Manager | Yes (JSON) | No edit | Could infer | No `recordRun` | Medium | **Defer** |
| ReportApprovalCard | `components/approvals/ReportApprovalCard.tsx` | Manager | No (worker report) | Note only | N/A | No | High | **Not applicable** |
| Action-plan API | `app/api/v1/ai/action-plan/route.ts` | API | Yes | No UI | Server | Yes | Low | **Defer** — no UI |
| Project-brief API | `app/api/v1/ai/project-brief/route.ts` | API | Yes | No UI | Server | Yes | Low | **Defer** |
| AdminAiRequestsClient | `admin/ai/requests/AdminAiRequestsClient.tsx` | Admin | Partial | No | Partial | Yes | Low | **Defer** — admin-only |
| Client portal | `ClientPortalRequestsSection.tsx` | Customer | N/A | N/A | N/A | N/A | High | **Not applicable** |

---

## `recordRun` routes (feedback prerequisite)

| Route | `recordRun` |
|-------|-------------|
| `POST .../copilot/chat/stream` | Yes (success + fallback) |
| `POST /api/v1/ai/action-plan` | Yes |
| `GET /api/v1/ai/project-brief` | Yes (success) |
| Edge copilot, intelligence GET, analyze-image | **No** |

---

## Tail closure wiring (Stage B)

**Wired in this sprint:**

1. **Web production** — `CopilotOptionalFeedback` moved to collapsed "Optional AI feedback" `<details>` visible in all environments (not dev/staging-only).
2. **iOS Manager** — `AiFeedbackSubmit` in Shared + optional `DisclosureGroup` in `ProjectCopilotChatView`.

**Justified skips:**

- Edge `AiActionPanel`, intelligence brief, vision — no safe pair without `recordRun` + edit UX.
- Reports — human workflow, not AI output correction.
- Action-plan — API-ready but no manager UI.

---

## Verdict

**Audited:** YES  
**Safe production targets identified:** YES (copilot stream web + iOS)  
**Other targets deferred with evidence:** YES
