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

Follow-up rerun after adding `PILOT_SMOKE_PROJECT_ID_PRODUCTION`:

- Workflow run: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26188813972>
- Job: `Post-deploy AI Phase 5 gate (non-blocking)` -> success
- Log evidence:
  - `PROJECT_ID: ***` present in gate environment
  - `ai_phase5_gate: analyze-image OK (degraded fallback=provider_unavailable)`
  - `ai_phase5_gate: copilot stream OK (done received)`

Latest repeat check:

- Workflow run: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26189062534>
- Job: `Post-deploy AI Phase 5 gate (non-blocking)` -> success
- Log evidence repeats same posture:
  - `PROJECT_ID: ***` present
  - `analyze-image OK (degraded fallback=provider_unavailable)`
  - `copilot stream OK (done received)`

Deploy-time provider-key injection check:

- Workflow run: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26190744467>
- Job: `Build and deploy to production` -> success
- Deploy evidence:
  - `env.OPENAI_API_KEY ("(hidden)")` present in Worker bindings
  - `env.ANTHROPIC_API_KEY ("(hidden)")` present in Worker bindings
- AI gate in same run:
  - `ai_phase5_gate: analyze-image OK (degraded fallback=provider_unavailable)`
  - `ai_phase5_gate: copilot stream OK (done received)`
- Interpretation: provider keys are now injected into production deploy runtime, but non-fallback vision path still degrades.

Production deploy regression recovery (2026-06-02):

- PR #72 introduced post-deploy `wrangler secret put`, but failed when deploy also passed `--var OPENAI_API_KEY` (`Binding name already in use`).
- PR #73 removed AI keys from deploy `--var`; deploy run `26848011286` green through secret put.
- Live checks after #73:
  - `GET /api/health` -> `openaiConfigured: true`, `aiConfigured: true`
  - `POST /api/v1/ai/analyze-image` -> HTTP 200 with `x-ai-fallback-reason: provider_unavailable`
- PR #74 set `OPENAI_VISION_MODEL=gpt-4o-mini` in `wrangler.deploy.toml`; deploy run `26848427586` still shows degraded analyze-image.
- Circuit reset via Supabase (`ai_provider_health` -> closed) does not change outcome; both providers record failures on invoke (policy decisions remain `allow`).
- Copilot stream gate `done received` is **not** proof of live OpenAI success — stream route emits `event: done` on deterministic fallback too.

Operator next step for full provider path:

1. Verify GitHub repo secrets `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` match active, billed provider projects (not revoked placeholders).
2. Re-run production deploy; confirm analyze-image returns HTTP 200 **without** `x-ai-fallback-reason`.
3. Reset circuits if needed: `node apps/web/scripts/reset-ai-provider-circuits.mjs` (service role required).

Provider-router failover hardening check:

- Commit: `e00a64e0` (`fix(ai): keep provider fallback chain on non-retryable errors`)
- Change: provider router now continues fallback chain even when a provider returns non-retryable classification (for example `invalid_input`), instead of terminating early.
- Validation:
  - Local tests passed:
    - `bun run test lib/platform/ai/providers/provider.router.test.ts`
    - `bun run test app/api/v1/ai/analyze-image/route.fallback.test.ts app/api/v1/ai/analyze-image/route.test.ts`
  - Production workflow run: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26207812004>
  - AI gate evidence remains:
    - `ai_phase5_gate: analyze-image OK (degraded fallback=provider_unavailable)`
    - `ai_phase5_gate: copilot stream OK (done received)`
- Interpretation: fallback-chain early-termination is not the remaining blocker; runtime still degrades at provider availability/capability level.

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
- `PILOT_SMOKE_PROJECT_ID_PRODUCTION` configured

## Readiness classification

- Live route behavior: **graceful degraded mode works**
- Provider-backed full AI path: **not proven** in this run (`provider_unavailable`)
- Copilot stream live success path: **proven** (`copilot stream OK (done received)` in runs `26188813972`, `26189062534`, `26190744467`, `26207812004`).

## Verdict

**PARTIAL / BLOCKED_EXTERNAL_FOR_FULL_PROVIDER_PATH**

## GA stance

- For broad GA, this remains a P1 blocker unless explicitly accepted as `GO WITH EXCEPTIONS`.
- Current recommended production posture: keep AI provider-backed vision under degraded/beta labeling per policy until non-fallback success is proven.

## Publication policy linkage

Until full provider-backed success is proven, publish AI capabilities under degraded policy:

- `docs/publication-readiness/AI_DEGRADED_MODE_POLICY.md`
- `docs/publication-readiness/KNOWN_LIMITATIONS.md`

## Operator closure commands

```bash
# rerun production deploy workflow (includes AI gate with stream probe)
gh workflow run deploy-cloudflare-prod.yml --repo 2qjckdknjf-ctrl/Aistroyka-web --ref main -f ref=main

# inspect AI gate logs and verify analyze-image switches to full vision path (no fallback header)
gh run watch <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --exit-status
gh run view <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --log | rg "ai_phase5_gate: analyze-image|ai_phase5_gate: copilot stream"

# if fallback persists, verify provider account-level readiness outside repo:
# - OpenAI/Anthropic project keys active and not revoked
# - model access enabled for configured vision models
# - quota/billing and org policy allow image calls
# - no provider-side regional/network block from Cloudflare egress
```

