# Branch, Commit, and PR Trace

**Date:** 2026-06-22  
**Current main:** `d9718b64d4e85a6d88f8e09981d3a115bdd66738`

## Current main verification

```
d9718b64 Merge pull request #122 (docs: live/staging smoke runbook)
4199e204 docs: add live staging smoke runbook
db850f70 Merge pull request #120 (API security header coverage)
1e29ce4d Merge pull request #121 (docs truth stacked audit)
68b0edb7 Merge pull request #109 (full reconciliation integration)
```

`git rev-parse origin/main` = `d9718b64` ✓

## Architecture-related branches found

| Branch | Remote | Notes |
|--------|--------|-------|
| `origin/cursor/aistroyka-system-maturity-7957` | yes | 17 commits ahead of merge-base; **584 commits behind** `origin/main` |
| `feature/unified-product-design-certification` | local only | Design/certification; not architecture lockdown intake target |

Branch name grep (`architecture|lockdown|forensic|service-contract|boundary|persistence|certification`):

- Remote: `origin/cursor/aistroyka-system-maturity-7957`
- Local: `feature/unified-product-design-certification`

No branch named `architecture-lockdown*` or `service-contract*` found.

## Commits (architecture / lockdown / forensic grep)

Notable hits on **`origin/cursor/aistroyka-system-maturity-7957`** (not on `main`):

| SHA | Subject |
|-----|---------|
| `63d9f26f` | architecture: final certification - normalization complete |
| `2fe34bb0` | architecture: stages 6-11 complete - provider boundaries, tenant/auth, error handling… |
| `00d60160` | architecture: repository layer hardening - 7 repositories created |
| `ff6f3ed4` | architecture: domain service normalization - service map created |
| `6cd27bee` | architecture: refactor worker, AI, admin, and project routes |
| `bc103cdd` | architecture: refactor tenant routes to service layer |
| `86c84047` | architecture: refactor critical routes - reports and media |
| `b4b779b9` | architecture: define enforceable target architecture standard |

On `main`: recent architecture grep hits are **design/docs** commits (public site certification, LG audits) — not the alleged lockdown certification bundle.

## PR trace

`gh pr list --state all --limit 80` filtered for architecture/lockdown/forensic/boundary:

| PR | State | Relevance |
|----|-------|-----------|
| #81 | MERGED | `chore: archive legacy root app leftovers` — tangential archive hygiene, not lockdown certification |

**No open or merged PR** titled or branched for “Architecture Lockdown CERTIFIED” or merging `cursor/aistroyka-system-maturity-7957` onto post-baseline `main`.

Recent merged PRs on `main` (#109, #120, #121, #122) — none are architecture lockdown.

## Archive trace

| Path | Result |
|------|--------|
| `/workspace/architecture_lockdown_artifacts_20260307_1348.tar.gz` | **Not found** |
| Repo search `architecture_lockdown_artifacts_*.tar.gz` (depth 6) | **Not found** |

## Source SHA (best candidate branch)

- **Branch tip:** `origin/cursor/aistroyka-system-maturity-7957` → `63d9f26f` (“final certification - normalization complete”)
- **Merge-base with `main`:** `a5bfc15d8a60a81696cf2998fef0b2adc987cd82`
- **On current main?** **NO** — `git merge-base --is-ancestor origin/cursor/aistroyka-system-maturity-7957 origin/main` fails

## Report duplication

- No in-repo copy of “Architecture Lockdown CERTIFIED 9.5/10” report text.
- Stale/overlapping docs exist elsewhere (e.g. `docs/audit/LEGACY_INVENTORY.md` references archived `PRODUCTION_LOCKDOWN_COMPLETE_*` — historical, not current lockdown certification).
