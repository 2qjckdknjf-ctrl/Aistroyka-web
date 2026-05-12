# Phase 7 — Daily digest implementation report

**Date:** 2026-05-07  
**Roadmap:** PHASE 7 — AI DAILY DIGEST (deterministic digest layer implemented; LLM narrative optional/future).

## What exists

| Item | Location |
|------|-----------|
| Types | `apps/web/lib/domain/digest/daily-digest.types.ts` |
| Service | `apps/web/lib/domain/digest/daily-digest.service.ts` |
| Tests | `apps/web/lib/domain/digest/daily-digest.service.test.ts` |
| Project API | `apps/web/app/api/v1/projects/[id]/daily-digest/route.ts` |
| Portfolio API | `apps/web/app/api/v1/dashboard/daily-digest/route.ts` |
| Manager UI | `apps/web/app/[locale]/(dashboard)/dashboard/DashboardDailyDigestClient.tsx` |
| Owner UI | `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalDailyDigestSection.tsx` |

## Behavior

- **Manager** digest lines use `ProjectSummary`, including internal budget pressure flags (`budgetOverBudget`, `budgetNearingLimit`) and operational counts (tasks, milestones, approvals, issues, commercial overdue).
- **Owner** digest lines are derived only from `getClientProjectView` output; duplicate logic is not allowed to “peek” at cost tables.

## Gaps vs roadmap

| Roadmap item | Status |
|----------------|--------|
| 7.1 Digest service | Done |
| 7.2 Audience separation | Done (`audience` query param + distinct builders) |
| 7.3 `project_daily_digests` table | Not implemented (optional) |
| 7.4 UI cards | Done |
| “AI” generated narrative | Not in scope of current code (deterministic digest only) |
| Regenerate control | Not exposed as a dedicated button (on-demand via refetch) |

## Verification

- Unit tests: `buildManagerDigestLinesFromSummary`, `buildOwnerDigestLinesFromClientView` (includes finance-isolation assertion on owner text).
- Full gate: `bun run lint`, `bun run test`, `bun run build`, `bun run cf:build`.

## Closure verdict

| Done criterion | Met? |
|----------------|------|
| Digest from real summary / portal data | **YES** |
| Manager vs owner separated | **YES** |
| Owner excludes internal finance phrasing (in tested paths) | **YES** |
| Tests for manager budget signal + owner isolation | **YES** |
| Broader empty/partial/risky matrix | **PARTIAL** — extend tests as needed |

**Phase 7 (digest layer):** **YES** for deterministic, audience-split digest; optional persistence and LLM layer remain future work.
