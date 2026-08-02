# AI Degraded Mode Rollout Policy

## Why this policy exists

Live evidence currently confirms stable fallback behavior but not fully reliable provider-backed image analysis on every production run.

## Allowed rollout mode

- AI can be shipped in **degraded/beta** mode if:
  - fallback responses are deterministic and safe,
  - no sensitive data is leaked in errors,
  - user-facing copy clearly marks degraded behavior.

## Forbidden claims

- Do not claim full production reliability for provider-backed image analysis while `provider_unavailable` remains in live evidence.
- Do not present degraded AI as equivalent to fully validated decision automation.

## Required user-facing labeling

- Mark affected AI features as `beta` or `degraded`.
- Add concise explanation in release notes and support runbook.
- Add operator check to verify whether fallback rate is increasing.

## Closure condition for removing degraded label

All items must pass:

1. Production deploy run shows non-fallback provider-backed success for analyze-image path.
2. Copilot stream probe remains green.
3. Final AI validation report no longer carries `PARTIAL / BLOCKED_EXTERNAL_FOR_FULL_PROVIDER_PATH`.

## References

- `docs/publication-readiness/AI_LIVE_PROVIDER_VALIDATION_REPORT.md`
- `docs/publication-readiness/USER_RELEASE_NOTES.md`
- Phase 7 closure (2026-07-30): `docs/roadmap/AISTROYKA_PHASE7_AI_RELIABILITY_CLOSURE_2026-07-30.md` — current source classified **YES — DEGRADED** until fail-closed rate-limit RPC is applied and per-target `--require-live` product proof is green for that runtime.
