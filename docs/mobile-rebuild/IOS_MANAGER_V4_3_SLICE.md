# iOS Manager V4.3 — implementation slice

**Date:** 2026-08-25  
**Branch:** `mobile/ios-manager-v4-3`  
**Worktree:** `/Users/alex/Projects/AISTROYKA-ios-manager-v4-3`  
**Canon:** `AISTROYKA_IOS_MANAGER_V4_3_PACKAGE` (15 screens, 390×844)

## What shipped

Native SwiftUI Manager uses the V4.3 five-tab IA (`Home`, `Projects`, `Tasks`, `AI`, `More`) and the dark/gold/AI-violet system from `DESIGN_SYSTEM.md`.

Live APIs stay the source of business data. Preview fixtures (`AISTROYKA_MANAGER_V43_PREVIEW` + UI test) are isolated and never mixed into production metrics. Manager-only budget/estimate reads stay on contractor surfaces.

## Screens

| # | Screen | Implementation |
|---|---|---|
| 01 | Sign-in + workspace | `ManagerLoginView` hero + Continue + Apple |
| 02 | Home / Today | `HomeDashboardView` featured project, attention cards, AI summary |
| 03 | Portfolio | `ProjectsListView` |
| 04 | Command center | `ProjectDetailView` |
| 05 | Tasks + calendar strip | `TasksListView` |
| 06 | Create task | `TaskCreateEditView` |
| 07 | Reports queue | `ReportsInboxView` V4.3 cards, filters, share queue |
| 08 | Report approval | `ReportDetailReviewView` gallery, approve/return, identifiers kept |
| 09 | AI Center | `AITabView` |
| 10 | AI risk decision | `AIRiskDetailView` + local audit store |
| 11 | Documents | `DocumentsHubView` |
| 12 | Team | `TeamOverviewView` presence, search, invite (web-admin truth) |
| 13 | Analytics | `ProjectAnalyticsView` + real PDF `ShareLink` |
| 14 | Notifications | `NotificationsView` timeline filters, read-all, deep links |
| 15 | Profile / More | `ManagerMoreView` + `ManagerSettingsView` + decisions list |

## Checks

- `xcodebuild build` AiStroykaManager, simulator `61119C43-B820-4109-9D0D-ACDE809191D6` — PASS
- `xcodebuild test` `ManagerV43UITests` — PASS (login, 5 tabs, More → Reports, screenshot walk)
- Simulator captures: `docs/mobile-rebuild/evidence/ios-manager-v4-3/`

## Remaining (honest)

- Task create still has no media upload API; UI states this and sends `report_required` only.
- Team invite / add-project have no in-app APIs; alerts tell the truth (web/admin).
- Live AI-risk detail (`10`) exists only when live jobs exist; empty AI center is honest.
- Analytics week/month/quarter picker does not change the series (no timeseries API).
- Full Dynamic Type XL / VoiceOver / landscape / slow-network suite was not run.
- Pixel lock vs all 15 PNGs is closer, not one-to-one.
- Follow-up plan: `docs/mobile-rebuild/IOS_MANAGER_V4_3_FOLLOWUP_PLAN.md`

## Verdict

**YES** for live login + remaining UI tails that are fixable in-app.  
**NO** for inventing missing APIs or claiming pixel-lock.
