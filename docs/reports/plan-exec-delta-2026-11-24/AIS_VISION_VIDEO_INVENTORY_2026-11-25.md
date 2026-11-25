# AIS-VISION video path inventory — 2026-11-25

Hard audit before claiming video LIVE. Image EVID chain already PASS on staging; this slice is native video daily analysis.

## Code map

| Path | Role |
|---|---|
| `app/api/v1/ai/analyze-video-daily/route.ts` | Sync POST; Gemini-only (no OpenAI/Anthropic fallback) |
| `lib/platform/ai/ai.service.ts` → `analyzeVideoDailyWork` | Fetch video with byte cap → policy → `invokeGeminiDailyWorkVideoAnalysis` |
| `app/api/v1/ai/analyze-video-daily/route.test.ts` + `route.auth.test.ts` | Unit/auth coverage |
| `job.handlers/ai-analyze-media.ts` | **Image-only** durable persist; does not analyze video |

Canonical async create remains `POST /api/v1/projects/:id/jobs` for image media; video daily stays synchronous compatibility path.

## Staging probe (2026-11-25)

Runtime `buildStamp.sha7=d84232f`. Auth SMOKE_* OK. Browser UA required.

| Call | HTTP | Observation |
|---|---|---|
| `POST /api/v1/ai/analyze-video-daily` `{}` | **503** | `Gemini is required for video daily analysis (set GOOGLE_AI_API_KEY or GEMINI_API_KEY)` |
| same with invalid / missing-file URL | **503** | Same — provider gate before fetch |

## Verdict

| Surface | Status |
|---|---|
| Video route + Gemini analyzer code | **CODE_PRESENT** |
| Staging video LIVE | **BLOCKED** — Gemini key not configured on staging Worker |
| Durable video→`ai_analysis`→human review→Graph | **NOT_RUN** (blocked by provider) |
| Physical device video capture | **NOT_RUN** / OWNER_GATE |

## Explicit non-claims

- Do not invent Gemini LIVE from image vision GO (`ai_live_provider.sh` / gpt-4o-mini is image path).
- Owner action: set `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` on staging (and production when ready), then re-smoke with a short https mp4 + project_id.
