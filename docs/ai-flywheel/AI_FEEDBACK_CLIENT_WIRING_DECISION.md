# AI Feedback Client Wiring Decision

**Date:** 2026-06-17

## Selected target

**`CopilotChatPanel` — optional dev/staging diagnostics block**

### Why safe

- Uses real `requestId` from assistant messages
- Has original assistant output (`rejectedOutput`) and optional manager correction textarea (`chosenOutput`)
- Collapsed under existing diagnostics `<details>` — zero change for production users who don't expand diagnostics
- No new required fields; submit button disabled until optional correction entered OR usefulness-only feedback without pair
- Calls existing `POST /api/v1/ai/feedback` only

### Why no behavior change

- Copilot stream output unchanged
- Feedback submit is optional admin/dev action
- Preference capture remains flag-gated server-side
- Capture failure does not block chat

### Enablement

- P2 adds fire-and-forget `recordRun()` on successful copilot stream completion so `runId` resolves in `ai_run_records`

## Skipped targets

- **AiActionPanel** — Edge function path; no unified run recorder in this sprint
- **AdminAiRequestsClient** — read-only explorer; adding edit UI broader than needed
- **Action-plan UI** — does not exist yet

## Fallback behavior

- If `runId` not found: feedback API returns 400; UI shows error; chat unaffected
- If preference fields incomplete: backend skips pair creation (parse returns null)
- If flags false: feedback succeeds; no pair write
