# Expert Review Queue Git / CI Evidence

**Date:** 2026-06-17  
**Timestamp (CI complete):** 2026-06-17T18:49Z (run 27711839037)

| Field | Value |
|-------|-------|
| Branch | `ai/expert-review-queue-mvp` |
| Base branch (stacked merge) | `ai/gold-memory-mvp` |
| Engineering commit SHA | `9baceb734b139dda8a1ee29ebaa33ec3fbb1f542` |
| Branch tip SHA (docs closure) | `44e6db1e5b0d47d1f8cf51e18623132e9f2d1b7a` |
| Stacked merge PR | **#105** — https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/105 |
| CI validation PR | **#106** — https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/106 (targets `main`; CI Check triggers on PRs to `main`/`master`) |
| Workflow | **CI Check** (`.github/workflows/ci-check.yml`) |

## CI runs

| Run ID | headSha | Result | Covers engineering MVP |
|--------|---------|--------|--------------------------|
| **27696094224** | `9baceb73…` | **success** | **YES** (feat commit) |
| **27696387950** | `268f3dff…` | **success** | YES (docs-only) |
| **27711839037** | `44e6db1e…` | **success** | YES (final evidence tip) |

- Engineering validation URL: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27696094224
- Final branch tip URL: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27711839037

## CI job steps (run 27696094224 — engineering SHA)

| Step | Result |
|------|--------|
| i18n messages (dashboard + activation) | success |
| Lint | success |
| Typecheck | success |
| Test | success |
| Cloudflare bundle (no deploy) | **success** |

## CI job steps (run 27711839037 — final branch tip)

| Step | Result |
|------|--------|
| i18n messages (dashboard + activation) | success |
| Lint | success |
| Typecheck | success |
| Test | success |
| Cloudflare bundle (no deploy) | **success** |

## Local validation (engineering commit)

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
