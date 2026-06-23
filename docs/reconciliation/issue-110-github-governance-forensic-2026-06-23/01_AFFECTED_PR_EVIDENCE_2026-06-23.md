# Affected PR Evidence

**Date:** 2026-06-23  
**Source:** GitHub API (`gh pr view`, `pulls/{n}/reviews`, `issues/{n}/timeline`)

## Summary table

| PR | Author | mergedAt (UTC) | Merge commit | reviewDecision | Formal APPROVED | Checks at merge | Merge actor | Formal approval absent? | Merge despite REVIEW_REQUIRED? |
|----|--------|----------------|--------------|----------------|-----------------|-----------------|-------------|-------------------------|--------------------------------|
| #109 | `2qjckdknjf-ctrl` | 2026-06-22T11:16:19Z | `68b0edb7` | REVIEW_REQUIRED | **NO** | PASS (`check`, Vercel, Workers) | `2qjckdknjf-ctrl` | YES | YES |
| #120 | `2qjckdknjf-ctrl` | 2026-06-22T12:56:18Z | `db850f70` | REVIEW_REQUIRED | **NO** | PASS | `2qjckdknjf-ctrl` | YES | YES |
| #122 | `2qjckdknjf-ctrl` | 2026-06-22T20:42:25Z | `d9718b64` | REVIEW_REQUIRED | **NO** | PASS | `2qjckdknjf-ctrl` | YES | YES |
| #124 | `2qjckdknjf-ctrl` | 2026-06-23T06:19:40Z | `54fb4058` | REVIEW_REQUIRED | **NO** | **CI pending at merge**¹ | `2qjckdknjf-ctrl` | YES | YES |

¹ PR #124: timeline shows merge at `06:19:40Z`; CI Check `check` completed SUCCESS at `06:20:51Z` — merge occurred **before** required check completed, consistent with admin bypass.

## Per-PR detail

### PR #109

- **URL:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/109
- **Reviews API:** 4 reviews, all `COMMENTED` — `cursor[bot]` (×2), `chatgpt-codex-connector[bot]` (×2). **Zero `APPROVED`.**
- **Timeline:** `merged` event actor `2qjckdknjf-ctrl`, commit `68b0edb7`.
- **Conclusion:** Large integration PR merged by repo owner without human `APPROVED` review record.

### PR #120

- **URL:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/120
- **Reviews API:** empty array. **Zero reviews of any state.**
- **Timeline:** `merged` actor `2qjckdknjf-ctrl`, commit `db850f70`.
- **Conclusion:** Security header fix merged with no review records at all.

### PR #122

- **URL:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/122
- **Reviews API:** empty array.
- **Timeline:** `merged` actor `2qjckdknjf-ctrl`, commit `d9718b64`.
- **Conclusion:** Docs-only runbook merged without review record.

### PR #124

- **URL:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/124
- **Reviews API:** 1 review — `chatgpt-codex-connector[bot]` `COMMENTED` only.
- **Timeline:** `reviewed` COMMENTED at `06:19:29Z`, `merged` at `06:19:40Z` by `2qjckdknjf-ctrl`.
- **Conclusion:** Forensic audit docs merged ~11s after bot comment; no `APPROVED`; CI still running.

## Cross-cutting findings

| Finding | All 4 PRs? |
|---------|------------|
| Same author and merge actor (`2qjckdknjf-ctrl`) | YES |
| `reviewDecision: REVIEW_REQUIRED` in API | YES |
| No non-author `APPROVED` in reviews API | YES |
| Bot `COMMENTED` reviews do not satisfy gate | YES (where bots reviewed) |
| Self-approve blocked by GitHub (`Can not approve your own pull request`) | Confirmed separately |

## Evidence confidence

**High** — merge actors and review states come directly from GitHub REST/GraphQL API and issue timelines; pattern is consistent across all four PRs.
