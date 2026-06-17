# Expert Review Queue Git / CI Evidence

**Date:** 2026-06-17  
**Timestamp (CI complete):** 2026-06-17T14:28 UTC (approx.)

| Field | Value |
|-------|-------|
| Branch | `ai/expert-review-queue-mvp` |
| Base branch (stacked merge) | `ai/gold-memory-mvp` |
| Commit SHA | `9baceb734b139dda8a1ee29ebaa33ec3fbb1f542` |
| Stacked merge PR | **#105** — https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/105 |
| CI validation PR | **#106** — https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/106 (targets `main`; required because CI Check triggers only on PRs to `main`/`master`) |
| Workflow | **CI Check** (`.github/workflows/ci-check.yml`) |
| Run ID | **27696094224** |
| URL | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27696094224 |
| Result | **success** |
| Run covers current SHA | **YES** (`headSha` = `9baceb73…`) |

## CI job steps (run 27696094224)

| Step | Result |
|------|--------|
| i18n messages (dashboard + activation) | success |
| Lint | success |
| Typecheck | success |
| Test | success |
| Cloudflare bundle (no deploy) | **success** |

## Local validation (same commit)

| Check | Result |
|-------|--------|
| vitest | 1621/1621 pass |
| lint | pass |
| i18n | pass |
| next build | pass |
| cf:build | pass |

## Migration

- `20260617160000_ai_expert_review_queue.sql` applied via Supabase MCP (AISTROYKA `vthfrxehrursfloevnlp`)

## Dry-runs

- `build-expert-review-queue.ts --dry-run`: 2 scanned, 1 eligible
- `build-gold-memory.ts --dry-run --source expert_reviews --limit 10`: pass

## Excluded from commit (working tree)

Unrelated local changes not part of this sprint: `AGENTS.md`, Stripe/billing files, wrangler env, `ios/Shared/.build/**`.
