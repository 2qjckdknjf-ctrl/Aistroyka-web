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

## Readiness classification

- Live route behavior: **graceful degraded mode works**
- Provider-backed full AI path: **not proven** in this run (`provider_unavailable`)
- Copilot stream live success path: not proven in this run because `PROJECT_ID` was empty in AI gate job (stream probe skipped).

## Verdict

**PARTIAL / BLOCKED_EXTERNAL_FOR_FULL_PROVIDER_PATH**

## Operator closure commands

```bash
# provide a valid project id for stream probe and rerun AI gate
# (in deploy workflow secrets/config)
# PILOT_SMOKE_PROJECT_ID_PRODUCTION=<project_uuid>

# optional direct rerun from CI context:
gh workflow run deploy-cloudflare-prod.yml --ref main -f ref=main
```

