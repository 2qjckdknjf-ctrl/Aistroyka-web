# AI Module Validation Report (Truth-Based)

**Last updated:** 2026-06-04  
**Repository:** AISTROYKA  
**Architecture:** See `docs/ai/AUDIT_AI_RUNTIME_ARCHITECTURE_TRUTH.md` — **BACKEND_OBSOLETE_APPS_WEB_CANONICAL**

---

## 1. Executive Verdict

| Field | Value |
|-------|-------|
| **LIVE AI PROVIDER** | **GO** |
| **CLASSIFICATION** | **LEVEL 4** |
| **Canonical live gate** | `bash scripts/smoke/ai_live_provider.sh --require-live` |
| **Gate result (this pass)** | **PASS** (exit 0) |
| **Blocker** | **none** for live provider path |

**Superseded gate (not authoritative):** `backend/.venv/bin/python scripts/check_ai_connection.py --require-live` — **invalid** for this repo (no `backend/` tree). Do not use in CI or audit verdicts.

---

## 2. Command Results

### 2.1 Canonical live gate (authoritative)

```bash
bash scripts/smoke/ai_live_provider.sh
bash scripts/smoke/ai_live_provider.sh --require-live
```

| Mode | Exit code | Summary |
|------|-----------|---------|
| Normal | `0` | JSON summary emitted; live vision succeeded on `BASE_URL` |
| `--require-live` | `0` | **GO** — `live_provider_call_succeeded: true`, `llm_success_count: 1` |

**Material stderr:** `ai_live_provider: verdict GO — live provider call succeeded`

**Probe:** `POST ${BASE_URL:-https://aistroyka.ai}/api/v1/ai/analyze-image` returned HTTP 200 **without** `X-AI-Fallback-Reason`; response body valid `AnalysisResult` shape (live vision router, not deterministic fallback).

### 2.2 Obsolete backend gate (historical — not run as authority)

| Command | Status |
|---------|--------|
| `python3 -m compileall backend/app backend/scripts` | **N/A** — paths absent |
| `cd backend && .venv/bin/python -m pytest tests -q` | **N/A** — no `backend/` |
| `check_ai_connection.py` | **N/A** — wrong architecture |

### 2.3 Web unit tests (supplementary, non-authoritative for LIVE)

```bash
cd apps/web && npm run test -- --run lib/copilot lib/ai-brain lib/platform/ai \
  app/api/v1/projects app/api/v1/ai
```

**Result (2026-06-04):** PASS (AI-focused vitest subset; consistency re-run: 264 tests, 56 files).

### 2.1b Consistency-patch revalidation (2026-06-04)

Re-run during `docs/ai/AI_AUDIT_CONSISTENCY_PATCH_REPORT.md` closure:

| Check | Result |
|-------|--------|
| `bash -n scripts/smoke/ai_live_provider.sh` | PASS |
| `ai_live_provider.sh` (normal) | exit 0; `live_provider_call_succeeded: true`; `fallback_count: 0` |
| `ai_live_provider.sh --require-live` | exit 0; verdict GO |

### 2.4 Production build

```bash
cd apps/web && npm run build
```

**Result (2026-06-04 follow-up):** **PASS** — contact routes use `insertContactLead` (`lib/public/contact-lead-submit.ts`); `npm run build` exit 0.

---

## 3. Environment Evidence

| Artifact | Status |
|----------|--------|
| `backend/` | **Absent** (obsolete for AISTROYKA) |
| `apps/web/` | **Canonical AI runtime** |
| Local `OPENAI_API_KEY` in dotfiles | **Not required** for this pass — production Worker has keys (`openaiConfigured: true` on health) |
| `BASE_URL` default | `https://aistroyka.ai` |

**OPENAI_API_KEY (local):** not read; **never printed**. Remote health confirmed provider configuration on deployment.

---

## 4. AI Provider Evidence

From `scripts/smoke/ai_live_provider.sh` JSON output (2026-06-04):

| Signal | Value |
|--------|-------|
| `provider_configured` | `true` (remote health + successful vision call) |
| `live_provider_call_attempted` | `true` |
| `live_provider_call_succeeded` | `true` |
| `provider` | `vision_router` |
| `model` | `gpt-4o-mini` |
| `error_kind` | `null` |

**Distinction:** Copilot stream `event: done` alone is **not** live proof. This gate requires **non-fallback** vision response or direct OpenAI 200.

---

## 5. Observability Counters

From canonical gate JSON (same run):

| Counter | Value |
|---------|-------|
| `llm_success_count` | `1` |
| `fallback_count` | `0` |
| `missing_key_count` | `0` |
| `fallback_rate` | `0%` |

**SUPERSEDED / STALE:** Prior matrices using `check_ai_connection.py` counters or `llm_success_count=0` without a gate run are **not authoritative**.

---

## 6. Classification

| Level | Requirement | Status |
|-------|-------------|--------|
| **LEVEL 4** | `ai_live_provider.sh --require-live` exit 0 + live provider success | **Met** |
| **LEVEL 3** | Gate missing or live proof fails | **Superseded** when LEVEL 4 met |

**CLASSIFICATION = LEVEL 4**

---

## 7. Go / No-Go

| Gate | Result |
|------|--------|
| **LIVE AI PROVIDER** | **GO** |
| **AI module (deterministic intelligence + unit tests)** | **CONDITIONAL** — see `AUDIT_AI_MODULE_FINAL_VERDICT.md` (build/contact TS still open) |
| **Obsolete Python backend live gate** | **NO-GO / N/A** — do not restore without ADR |

---

## 8. Remaining Blockers

1. **Recurring:** Re-run `ai_live_provider.sh --require-live` after each production AI deploy.  
2. ~~**P1:** `cf:build`~~ — PASS (2026-06-04, OpenNext bundle complete).  
3. ~~**P1:** Cross-tenant `analyze-image`~~ — `getProjectForInternalWorkspace` when `project_id` set (2026-06-04).  
4. **P2:** Optional web migration for `ai_llm_logs` if operators need SQL pane matching legacy SLO tables.  
5. **P1:** iOS Manager intelligence/copilot parity or documented deferral.

**Not a blocker:** Missing local `backend/` or local `OPENAI_API_KEY` when production gate passes.

---

## 9. Final Truth Statement

**AISTROYKA’s canonical live AI gate is `bash scripts/smoke/ai_live_provider.sh --require-live` against the deployed `apps/web` Worker; on 2026-06-04 it exited 0 with a non-fallback vision response, so LIVE AI PROVIDER is GO at LEVEL 4.**

---

## Appendix — Gate migration note

| Era | Authoritative? | Gate |
|-----|----------------|------|
| Pre-2026-06-04 (wrong arch) | **NO** | `backend/.../check_ai_connection.py --require-live` |
| Current | **YES** | `scripts/smoke/ai_live_provider.sh --require-live` |
