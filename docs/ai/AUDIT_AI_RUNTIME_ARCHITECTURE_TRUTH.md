# AI Runtime Architecture Truth

**Date:** 2026-06-04  
**Project:** AISTROYKA monorepo

---

## Verdict

**B. BACKEND_OBSOLETE_APPS_WEB_CANONICAL**

There is **no** `backend/` application tree, **no** `backend/.venv`, and **no** `scripts/check_ai_connection.py` in this repository. A Python backend live gate copied from another project (e.g. HiAir) is **architecturally invalid** for AISTROYKA.

---

## Evidence

| Check | Finding |
|-------|---------|
| `backend/` at repo root | **Absent** |
| `apps/web/` | **Present** — Next.js App Router, OpenNext, Cloudflare Workers deploy |
| AI HTTP routes | `apps/web/app/api/v1/ai/*`, `apps/web/app/api/v1/projects/[id]/copilot/*` |
| AI libraries | `apps/web/lib/copilot/*`, `apps/web/lib/platform/ai/*`, `apps/web/lib/ai-brain/*` |
| Deploy config | `apps/web/wrangler.toml`, `apps/web/wrangler.deploy.toml` — `AI_ANALYSIS_URL`, `OPENAI_VISION_MODEL` vars; secrets via Wrangler/GitHub |
| Legacy paths | `apps/web/app/api/ai/*` re-export or duplicate v1 handlers |
| Obsolete gate reference | Only in `docs/ai/AUDIT_AI_VALIDATION_REPORT.md` (pre-fix); **not** in product code |

---

## Real AI runtime location

| Layer | Path / surface |
|-------|----------------|
| **Runtime** | Cloudflare Worker (OpenNext bundle) serving `apps/web` |
| **Vision / policy / router** | `lib/platform/ai/ai.service.ts` → providers → usage |
| **Copilot (non-stream)** | `GET /api/v1/projects/:id/copilot` → `lib/copilot/copilot.service.ts` |
| **Copilot (stream)** | `POST /api/v1/projects/:id/copilot/chat/stream` → OpenAI SSE |
| **Intelligence (deterministic)** | `GET /api/v1/projects/:id/intelligence` → `lib/ai-brain/services/*` |
| **Async jobs** | `ai_analyze_media` / `ai_analyze_report` job handlers |
| **Persistence** | Supabase (`ai_chat_*`, `ai_usage`, `ai_analysis`, `audit_logs`, …) |

Production traffic does **not** flow through a repo-local Python `backend/app`.

---

## Real provider configuration location

| Where | Variables |
|-------|-----------|
| **Worker runtime** | Wrangler secrets / GitHub Actions (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, …) |
| **Build-time public** | `NEXT_PUBLIC_*` in wrangler `[env.*.vars]` |
| **Local dev** | `apps/web/.env.local`, repo `.env.pilot`, `.env.local` (gitignored) — optional |
| **Health signal** | `GET /api/v1/health` → `openaiConfigured`, `aiConfigured` |

Keys are read in `apps/web/lib/config/server.ts` (`getServerConfig`, `isOpenAIConfigured`, `getConfiguredVisionProviders`).

---

## Real smoke / validation scripts (canonical set)

| Script | Role |
|--------|------|
| **`scripts/smoke/ai_live_provider.sh`** | **Authoritative live gate** (env + remote/direct probe, `--require-live`) |
| `scripts/smoke/ai_vision.sh` | Vision route shape + fallback header |
| `scripts/smoke/ai_phase5_gate.sh` | Phase 5 combined gate (CI/deploy) |
| `scripts/smoke/ai_copilot_stream.sh` | SSE `done` (not sufficient alone for live LLM) |
| `scripts/smoke/ai_intelligence.sh` | Deterministic intelligence bundle |
| `apps/web` vitest | Unit/route tests (no live provider) |

**Non-canonical / invalid for this repo:** `backend/.venv/bin/python scripts/check_ai_connection.py`

---

## Current validation gaps

1. **No in-repo Python AI backend** — any doc requiring `backend/` is stale.  
2. **Local keys often absent** — live proof must target **deployed** `BASE_URL` or operator-supplied env.  
3. **Copilot `event: done` ≠ live LLM** — stream completes on deterministic fallback too.  
4. **Vision 200 ≠ live vision** — must check absence of `X-AI-Fallback-Reason` / `fallback_reason`.  
5. **SLO docs referencing `ai_llm_logs`** — may not match web Worker telemetry (`audit_logs` + structured logs).

---

## Required action (completed in this pass)

1. Add `scripts/smoke/ai_live_provider.sh` as canonical `--require-live` gate.  
2. Rewrite `docs/ai/AUDIT_AI_VALIDATION_REPORT.md` to reference only that gate.  
3. Align `AUDIT_AI_LIVE_VALIDATION.md`, `AUDIT_AI_MODULE_FINAL_VERDICT.md`, and publication-readiness cross-links.

---

## Architecture decision record (short)

**Do not** add a fake `backend/` tree to satisfy audit tooling. **Do** validate live AI through `apps/web` routes on a configured deployment (or direct provider probe when keys exist locally without printing secrets).
