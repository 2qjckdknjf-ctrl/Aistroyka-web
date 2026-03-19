# Phase 8 — Observability inventory

**Date:** 2026-03-16  
**Scope:** `apps/web` AI/runtime surface.

## Request / trace IDs

| Item | Status | Signal | Gap |
|------|--------|--------|-----|
| `getOrCreateRequestId` / `X-Request-Id` | **Exists** | Intelligence, copilot non-stream, vision | Stream uses same header |
| Client copy (Copilot UI) | **Exists** | `requestId` on messages | — |

## Structured logs (`logStructured` / `ai-telemetry`)

| Item | Status | Events | Gap |
|------|--------|--------|-----|
| Copilot stream | **Enhanced** | `ai_copilot_stream_started`, `first_token`, `finished`, `failed`, `cancelled`, `complete`, `error` | — |
| Copilot GET brief | **Exists** | `ai_copilot_non_stream_complete` + fallback flag | — |
| Intelligence GET | **Enhanced** | `ai_intelligence_complete` + diagnostics object | — |
| Vision analyze | **Enhanced** | `ai_vision_analyze_complete` / `_error` | Legacy `ai_analyze_image` removed in favor of vision events |

## DB audit (`audit_logs`, `resource_type: ai_runtime`)

| Item | Status | Actions |
|------|--------|---------|
| Copilot stream | **Exists** | complete / error |
| Copilot GET | **Exists** | non_stream_complete |
| Intelligence | **New** | complete / error |
| Vision | **New** | complete / error |

## Metrics / admin

| Item | Status | Notes |
|------|--------|-------|
| `GET /api/v1/admin/metrics/overview` | Exists | General product metrics |
| `GET /api/v1/admin/ops/ai-runtime` | **New** | AI runtime rollup + aggregates |

## Blind spots (accepted / P2)

| Risk | Priority |
|------|----------|
| No distributed trace IDs across browser → OpenAI | P2 |
| Log volume at very high chat QPS | P2 |
| Per-tenant rate dashboards | P2 |
