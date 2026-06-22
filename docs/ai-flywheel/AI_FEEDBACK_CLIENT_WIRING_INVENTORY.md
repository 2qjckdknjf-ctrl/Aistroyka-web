# AI Feedback Client Wiring Inventory

**Date:** 2026-06-17  
**Sprint:** P2 Hardening

## Summary

`POST /api/v1/ai/feedback` exists server-side (Phase D) with optional preference-pair fields (flywheel foundation). **No production web/mobile client previously called this route.**

---

## Callers searched

| Location | Calls `/api/v1/ai/feedback`? | Payload | Preference derivable? | Risk |
|----------|------------------------------|---------|---------------------|------|
| Web dashboard (all) | **No** | — | — | — |
| `AiActionPanel` | No (Edge copilot) | — | Has `requestId` + output text in dev diagnostics | Medium — Edge path, no `ai_run_records` until stream route records runs |
| `CopilotChatPanel` | **No (before P2)** | — | Has `requestId`, assistant `content`, user question | **Low** — uses Next stream route |
| `AdminAiRequestsClient` | No | — | Has requestId + chat messages (read-only) | Low — admin-only |
| `ClientPortalRequestsSection` | No | `feedback_text` to client-requests API | Not AI preference pair | **Skip** — customer portal, wrong API |
| iOS / Android | No matches | — | — | **Skip** — deferred Android; iOS no caller |
| Eval runner `/api/v1/ai/evals/run` | No | — | — | **Skip** — system eval, not manager edit |
| Action-plan / project-brief API | No client UI | Server records `ai_run_records` | Would be ideal when UI exists | Deferred |

---

## Backend-only surfaces (run records exist)

| Route | Records `ai_run_records` | Client UI |
|-------|--------------------------|-----------|
| `POST /api/v1/ai/action-plan` | Yes | None |
| `GET /api/v1/ai/project-brief` | Yes | None |
| `POST .../copilot/chat/stream` | **Added in P2** (fire-and-forget) | `CopilotChatPanel` |

---

## Selected first wiring targets (Stage B)

1. **`CopilotChatPanel` diagnostics (dev/staging only)** — optional correction + feedback submit; no required fields; uses existing `/api/v1/ai/feedback`
2. **Client library** `submitAiFeedback()` — reusable for future manager edit flows

## Intentionally skipped

| Target | Reason |
|--------|--------|
| Client portal feedback | Wrong domain API; not AI output edit |
| Report manager_note | No `runId` / AI output pairing |
| Android | Product scope deferred |
| New required UI fields | Violates no-friction rule |
| AiActionPanel Edge copilot | No Next-route run record unless Edge adds parity |
