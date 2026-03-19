# Phase 8 — Observability completion summary

## Observable now

- **Which AI routes fire** — log `event` + `route`; audit `action`.
- **Failure rate** — admin `aggregates.by_action` + `errors_by_kind`.
- **Latency** — `latency_ms` on all completions; `first_token_ms` on stream.
- **Context trim** — `context_trim_applied`, `context_tokens_estimated`.
- **Fallback** — Copilot GET `fallback_triggered`.
- **Stream breaks** — lifecycle events + `error_kind`.
- **Intelligence degradation** — `intelligence_diagnostics.degradation_reason_codes`, data sufficiency, factor keys.
- **Tenant/project/request** — ids on logs and audit.
- **Post-release** — `build_sha7` + `app_env`.

## Still blind (low priority)

- Per-token cost on copilot stream (only duration).
- Full OpenAI request id correlation.

## Closure decision

**Phase 8 is closed enough to proceed** to the next chartered work. No P0 observability blockers remain for operating AI/intelligence at pilot scale.

**Exact blockers:** none for closure.
