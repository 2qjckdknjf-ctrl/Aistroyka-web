# Phase 8 — AI route telemetry standard

## Principles

1. **Never log:** raw prompts, user message text, retrieved private narrative, image URLs, API keys, tokens.
2. **Always prefer:** `request_id`, `tenant_id`, `project_id`, `route`, timings, enums, counts, flags.

## Required metadata (when applicable)

| Field | Type | Routes |
|-------|------|--------|
| `request_id` | string | All |
| `route` | string | All |
| `tenant_id` | uuid | Authed |
| `project_id` | uuid | Project-scoped |
| `user_id` | uuid | When available |
| `latency_ms` | number | All |
| `output_type` | copilot \| intelligence \| vision | All |
| `streaming` | boolean | Copilot |
| `provider` | string enum | OpenAI / vision_router / none |
| `fallback_triggered` | boolean | Copilot GET |
| `context_tokens_estimated` | number | Copilot stream |
| `context_trim_applied` | boolean | Copilot stream |
| `memory_used`, `memory_chunks_count`, `summary_used` | number/bool | Copilot stream |
| `first_token_ms` | number \| null | Copilot stream |
| `error_kind` | see taxonomy | Errors |
| `retryable` | boolean | Stream / provider errors |
| `build_sha7` | string | When `NEXT_PUBLIC_BUILD_SHA` / `VERCEL_GIT_COMMIT_SHA` set |
| `app_env` | string | `NEXT_PUBLIC_APP_ENV` or `NODE_ENV` |

## Stream lifecycle log events

| Event | Meaning |
|-------|---------|
| `ai_copilot_stream_started` | SSE stream opened |
| `ai_copilot_stream_first_token` | First model delta |
| `ai_copilot_stream_finished` | Normal completion |
| `ai_copilot_stream_failed` | Provider / transport error |
| `ai_copilot_stream_cancelled` | Client disconnect or abort |
| `ai_copilot_stream_complete` | Summary line (full latency) |
| `ai_copilot_stream_error` | Error summary line |

## Intelligence payload extension

`intelligence_diagnostics` — see `PHASE8_INTELLIGENCE_DIAGNOSTICS_STANDARD.md`.
