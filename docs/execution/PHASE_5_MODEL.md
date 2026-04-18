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
