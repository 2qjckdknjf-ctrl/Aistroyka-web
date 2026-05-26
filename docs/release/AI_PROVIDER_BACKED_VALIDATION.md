# AI Provider-Backed Validation

Date: 2026-05-22  
Project: AISTROYKA

## Goal

Verify whether AI runtime is proven on non-fallback provider-backed path for release upgrade.

## Validation sources

1. Existing report:
   - `docs/publication-readiness/AI_LIVE_PROVIDER_VALIDATION_REPORT.md`
2. Latest scheduled AI gate run logs:
   - Workflow run `26219023147` (`AI Phase 5 SLO (staging)`)

## Safe config presence checks (no secret values printed)

- Workflow environment in run `26219023147` confirms auth path for AI gate execution is present (`AUTH_HEADER`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` shown as masked).
- Local shell in this pass does not require provider secret printing and no provider key values are exposed.

## Runtime evidence

From run `26219023147` log:

- `ai_phase5_gate: analyze-image OK (degraded fallback=provider_unavailable)`
- `ai_phase5_gate: copilot stream OK (done received)`
- `fallback_triggered` (analyze-image path): `true` (derived from explicit `degraded fallback=provider_unavailable`)

Interpretation:

- Copilot stream path is operational.
- Vision/analyze-image path still reports degraded fallback mode (`provider_unavailable`), which is not non-fallback provider proof.

## Result

**PARTIAL / OPERATOR_REQUIRED**

- Non-fallback provider-backed closure for `analyze-image` is not proven in this pass.
- Fallback behavior is healthy and controlled, but that is insufficient for GO upgrade to full public GA.

## Operator-required closure steps

1. Re-run production deploy AI gate:

```bash
gh workflow run deploy-cloudflare-prod.yml --repo 2qjckdknjf-ctrl/Aistroyka-web --ref main -f ref=main
```

2. Validate logs for non-fallback success:

```bash
gh run watch <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --exit-status
gh run view <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --log | rg "ai_phase5_gate: analyze-image|ai_phase5_gate: copilot stream"
```

3. Acceptance criterion:
   - `analyze-image` line must indicate provider-backed success without degraded fallback reason.
