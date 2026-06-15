# Vision & Evidence Audit

**Date:** 2026-06-04

---

## Image analysis route

**Canonical:** `POST /api/v1/ai/analyze-image`  
**Pipeline:** Rate limit → tenant context → quota → `analyzeImage()` in `AIService` → policy → `invokeVisionWithRouter` → normalize/sanitize/calibrate.

**Legacy:** `POST /api/ai/analyze-image` — same logic + deprecation headers.

**Degraded success:** `AI_VISION_DETERMINISTIC_FALLBACK` (default true) → HTTP 200 + `X-AI-Fallback-Reason` when providers fail.

---

## Async evidence linkage

| Mechanism | Path |
|-----------|------|
| Report submit enqueues jobs | ADR-010: `ai_analyze_report`, `ai_analyze_media` |
| Status polling | `GET /api/v1/reports/:id/analysis-status` |
| Handler tests | `job.handlers/ai-analyze-media.test.ts` |
| Project AI job list | `GET /api/v1/projects/:id/ai` |

---

## Evidence Quality Matrix

| Dimension | Implementation | Quality | Tests |
|-----------|----------------|---------|-------|
| Before photo | `evidence-intelligence` + `before_after_gap` signal | **PARTIAL** — depends on media purpose tags | Service-level |
| After photo | Same | **PARTIAL** | Service-level |
| Stale evidence | `evidence-staleness.service.ts` | **ACTIVE** | Via missing-evidence tests |
| Media count vs required | Gap calculation in signals | **ACTIVE** | missing-evidence |
| Media quality (blur/lighting) | Not found in vision result schema | **OPEN** | None |
| Report body quality | `report-intelligence.service` | **ACTIVE** | discipline signals |
| Task/milestone linkage | `report.service` task-link tests | **PARTIAL** | task-link.test.ts |
| AI confidence on vision | `risk_level` + calibration only | **PARTIAL** — no per-field confidence |
| Report media linkage | Jobs use `media_id` / `report_id` in `AnalyzeImageInput` | **ACTIVE** | Handler unit tests |

---

## Failure cases (observed / coded)

| Case | HTTP / behavior |
|------|-----------------|
| No provider keys | 503 |
| Policy block | 403 (`AIPolicyBlockedError`) |
| Quota exceeded | 402 |
| Rate limit | 429 |
| Invalid URL / non-HTTPS prod | 400 |
| Body > 100KB | 413 |
| All providers fail (fallback off) | 502/504 |
| All providers fail (fallback on) | 200 + medium risk placeholder issues |

---

## Missing tests

1. End-to-end vision with **real** provider (intentionally absent — env gated).
2. Cross-tenant `project_id` on analyze-image body rejected (policy may cover — no dedicated test found).
3. Media quality scoring regression suite.
4. Before/after linkage integration test across upload → report → analyze job.

---

## Recommended fixes (priority)

| P | Fix |
|---|-----|
| P0 | None blocking deterministic intelligence; vision P0 is **prove provider path in staging** with smoke scripts |
| P1 | Add integration test: tenant A cannot analyze with tenant B `project_id` |
| P1 | Document/media purpose enforcement for before/after in upload finalize |
| P2 | Optional confidence field on `AnalysisResult` contract |
| P2 | Media quality heuristics (blur detection) behind feature flag |

---

## Vision subsystem verdict

**Status:** **CONDITIONAL** — Architecture (AIService, policy, router, fallback) is **ACTIVE** and tested at unit/route level; **live vision proof** and **evidence media quality** remain **OPEN**.
