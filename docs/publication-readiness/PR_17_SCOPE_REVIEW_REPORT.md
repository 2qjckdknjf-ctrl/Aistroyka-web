# PR #17 Scope Review Report

## Context

- PR: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/17>
- Head: `release/publication-readiness-mega-sprint`
- Base: `main`

## Classification summary

| Class | Scope | Approx. files | Notes |
|---|---|---:|---|
| A | Publication-readiness core | 173 | `apps/web`, `ios`, `android`, `docs/publication-readiness`, key scripts/workflows/contracts tied to stages 08-18. |
| B | Required metadata / lockfile | 2 | `package.json`, `bun.lock` (only tied to Cloudflare-agent addition). |
| C | Cloudflare agent starter | 8 | `apps/cloudflare-agent/*`, `docs/cloudflare/CLOUDFLARE_AGENT_STARTER.md`. |
| D | Risky / unclear | 1 | `AGENTS.md` historical drift in branch history, not required for final publication merge. |
| E | Unrelated / broad historical docs | 44 | cross-cutting docs and historical audit artifacts not needed for current live blocker closure. |

## Cloudflare-agent decision

- Decision: **SPLIT_OUT**.
- Reason:
  1. Cloudflare-agent starter is not required to close publication-readiness P0/P1 blockers.
  2. Keeping it in PR #17 increases review surface and risk during pre-merge hardening.
  3. Scope split preserves code while isolating release-critical merge path.

## Actions executed

1. Created preservation branch:
   - `release/cloudflare-agent-starter-split`
   - pushed to `origin/release/cloudflare-agent-starter-split`
2. Removed Cloudflare-agent from publication branch by reverting:
   - `fc4d5ace` (cloudflare-agent starter commit)
   - `126594cc` (root metadata/lockfile commit tied to that addition)

## PR cleanliness verdict

- Current PR #17 after split move is cleaner and publication-focused.
- Remaining merge posture still depends on live blocker closure stages.

## Merge recommendation (scope stage)

- **READY_TO_MERGE_AFTER_LIVE_BLOCKERS**
  - Scope is now acceptable for publication-readiness.
  - Live evidence blockers still gate final merge/public verdict.

