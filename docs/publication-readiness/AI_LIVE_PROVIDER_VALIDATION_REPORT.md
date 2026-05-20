# AI Live Provider Validation Report

## Goal

Classify live AI/copilot readiness based on real production evidence.

## Live evidence collected

### 1) Post-deploy AI gate (authenticated)

- Workflow run: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26146584712>
- Job: `Post-deploy AI Phase 5 gate (non-blocking)` -> success
- Log evidence:
  - `ai_phase5_gate: analyze-image OK (degraded fallback=provider_unavailable)`
  - Indicates authenticated live probe works, but via deterministic fallback due provider unavailability.

Latest rerun:

- Workflow run: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26186503554>
- Job: `Post-deploy AI Phase 5 gate (non-blocking)` -> success
- Log evidence:
  - `PROJECT_ID:` empty in gate environment (stream probe disabled by gate script)
  - `ai_phase5_gate: analyze-image OK (degraded fallback=provider_unavailable)`

### 2) Public unauthenticated fallback probe

Command:

```bash
curl -i -X POST https://aistroyka.ai/api/v1/ai/analyze-image \
  -H "Content-Type: application/json" \
  --data '{"image_url":"https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=70"}'
```

Observed:

- HTTP 200 with `x-ai-fallback-reason: provider_unavailable`
- Response returns deterministic safety payload (no secret leakage in body/headers).

### 3) Latest rerun (live-closure pass)

Checks executed:

1. Local provider key presence check:
   - result: `AI_PROVIDER_KEY_MISSING` in current shell (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` absent)
2. Copilot stream probe without auth:
   - `POST /api/v1/projects/<id>/copilot/chat/stream` -> HTTP 401 (`{"error":"Authentication required"}`)

Interpretation:

- Non-stream degraded fallback remains stable and safe.
- Stream path correctly enforces auth.
- Full provider-backed success path remains unproven in this environment.

### 4) Continuation attempt (current pass)

Environment probe for provider-path closure:

- `AUTH_HEADER`: missing
- `PROJECT_ID` / `PILOT_SMOKE_PROJECT_ID_PRODUCTION`: missing
- provider keys (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY`): missing

Conclusion:

- No authenticated/project-scoped live provider probe can be executed from this shell.
- Status remains partial until operator-supplied runtime context is present.

Repository secret inventory check (`gh secret list`) confirms:

- `OPENAI_API_KEY` present
- `ANTHROPIC_API_KEY` present
- `PILOT_SMOKE_PROJECT_ID_PRODUCTION` absent

## Readiness classification

- Live route behavior: **graceful degraded mode works**
- Provider-backed full AI path: **not proven** in this run (`provider_unavailable`)
- Copilot stream live success path: not proven in this run because `PROJECT_ID` was empty in AI gate job (stream probe skipped).

## Verdict

**PARTIAL / BLOCKED_EXTERNAL_FOR_FULL_PROVIDER_PATH**

## Operator closure commands

```bash
# add missing stream probe secret
gh secret set PILOT_SMOKE_PROJECT_ID_PRODUCTION --repo 2qjckdknjf-ctrl/Aistroyka-web --body "<project_uuid>"

# rerun production deploy workflow (includes AI gate)
gh workflow run deploy-cloudflare-prod.yml --repo 2qjckdknjf-ctrl/Aistroyka-web --ref main -f ref=main

# inspect AI gate logs for provider-backed + stream evidence
gh run watch <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --exit-status
gh run view <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --log
```

