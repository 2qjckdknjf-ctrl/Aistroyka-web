# Phase 5 — Semantic Model (AI Interaction Hardening)

**Date:** 2026-04-18  
**Stage:** B — Semantic Model

## Target behavior

AI interaction runtime must prefer recoverability over premature failure:

1. When image URL is not yet available due to pending upload progression, `ai_analyze_media` is retryable.
2. Only irrecoverable payload defects should become `dead` immediately.
3. Retry state remains observable through `jobs.status`, `attempts`, and `last_error_type`.

## Job outcome semantics

- `JOB_PAYLOAD_ERROR` => non-retryable, may go `dead`.
- `JOB_HANDLER_ERROR` with `retryable=true` => return to `queued` with backoff.

## Reliability rule added in this slice

For `ai_analyze_media`:

- unresolved URL + `upload_session.status in ('created','uploaded')` => retryable handler error.
- unresolved URL + media row exists but `file_url` not yet present => retryable handler error.
- unresolved URL without pending indicators => payload error.

## Phase 5 slice closure criteria

1. Unit tests prove classification behavior.
2. Staging runtime shows pending upload case does not enter `dead`.
3. Deploy + smoke pipeline remains green after fix.

## Vision analyze semantics (slice 2)

When all configured vision providers fail after policy allow:

- **Preferred:** return HTTP `200` with a deterministic `AnalysisResult`-shaped payload and response header `X-AI-Fallback-Reason` (`provider_unavailable` | `provider_timeout`).
- **Escape hatch:** set `AI_VISION_DETERMINISTIC_FALLBACK=false` to restore legacy HTTP `502`/`504` for strict integrators.

Telemetry:

- Provider outage still emits `ai_vision_analyze_error` with underlying `error_kind`.
- Successful fallback completion emits `ai_vision_analyze_complete` with `error_kind=fallback_invoked` and `provider=none`.

## Copilot stream semantics (slice 2)

When upstream chat completion stream cannot be satisfied by the model provider:

- Emit terminal SSE `done` with `fallback_reason` and persisted assistant message (avoid fatal `error` event that prevents client parsers from consuming `done`).
