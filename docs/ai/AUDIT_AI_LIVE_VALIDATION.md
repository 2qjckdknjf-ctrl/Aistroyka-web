# AI Live Validation Readiness

**Date:** 2026-06-04  
**Architecture:** `docs/ai/AUDIT_AI_RUNTIME_ARCHITECTURE_TRUTH.md` (apps/web canonical; **no** Python `backend/`)

---

## Authoritative live gate

```bash
bash scripts/smoke/ai_live_provider.sh --require-live
```

- **LEVEL 4** requires exit 0 and `live_provider_call_succeeded: true` in JSON stdout.
- **SUPERSEDED / NOT AUTHORITATIVE:** `backend/.venv/bin/python scripts/check_ai_connection.py` (path does not exist in AISTROYKA).

Latest truth-based result: `docs/ai/AUDIT_AI_VALIDATION_REPORT.md`.

---

## Existing automation

| Script / workflow | Covers |
|-------------------|--------|
| **`scripts/smoke/ai_live_provider.sh`** | **Canonical** — env/health + non-fallback vision or direct OpenAI; `--require-live` |
| `scripts/smoke/ai_phase5_gate.sh` | Vision 200 + optional copilot stream `done` (CI/deploy; not sole live proof) |
| `scripts/smoke/ai_copilot_stream.sh` | SSE meta + done (fallback also emits `done`) |
| `scripts/smoke/ai_intelligence.sh` | Intelligence bundle shape (deterministic) |
| `scripts/smoke/ai_vision.sh` | analyze-image 200/fallback header |
| `apps/web/tests/e2e/ai-smoke.spec.ts` | Mocked edge copilot — not live OpenAI |
| `.github/workflows/ios-ui-smoke.yml` | iOS UI — not AI provider |
| Staging deploy + `pilot-e2e-audit` | Web pilot — not AI-specific |

All new scripts accept: `BASE_URL`, `AUTH_HEADER`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PROJECT_ID`, `IMAGE_URL`.

**No secrets committed.**

---

## Validation matrix

| Check | Runnable locally? | Evidence this audit |
|-------|-----------------|---------------------|
| AI staging smoke (vision) | **YES** if auth + BASE_URL | Script exists; not executed (no env) |
| Copilot stream smoke | **YES** if `OPENAI` on server + admin client | Script added; blocked without deploy keys |
| Copilot non-stream smoke | **YES** via curl `GET .../copilot?useCase=generateManagerBrief` | Same gate as stream |
| Provider fallback smoke | **YES** — expect `X-AI-Fallback-Reason` or stream `fallback_reason` | Unit tests prove logic |
| Image analysis smoke | **YES** — `ai_vision.sh` / phase5 gate | |
| Intelligence smoke | **YES** — `ai_intelligence.sh` | |
| Telemetry verification | **PARTIAL** — requires log sink or `audit_logs` query post-run | Admin `ops/ai-runtime` |

---

## Environment notes

| Variable | Status |
|----------|--------|
| Local `OPENAI_API_KEY` | Optional — gate can pass via **deployed** `BASE_URL` |
| `BASE_URL` | Default `https://aistroyka.ai` in `ai_live_provider.sh` |

---

## Operator path

1. Run canonical gate:
   ```bash
   bash scripts/smoke/ai_live_provider.sh
   bash scripts/smoke/ai_live_provider.sh --require-live
   ```
2. Optional supplementary smokes (auth/project): `ai_vision.sh`, `ai_intelligence.sh`, `ai_copilot_stream.sh`, `ai_phase5_gate.sh`
3. Admin rollup: `GET /api/v1/admin/ops/ai-runtime?hours=24`

---

## Live validation verdict

**Status:** **GO (live provider)** when `--require-live` exits 0 — see `AUDIT_AI_VALIDATION_REPORT.md`.  
**SUPERSEDED:** “BLOCKED_EXTERNAL only” stance before canonical gate existed.
