# Design System — Phase 2 Real Components

**Date:** 2026-03-07  
**Scope:** Reusable Manager UI components under AiStroykaManager/Design.

## Components added

| Component | Purpose |
|-----------|---------|
| LoadingStateView | message; spinner + text; used in dashboard, team, reports, tasks, AI |
| EmptyStateView | title, subtitle?, actionTitle?, action?; tray icon + text |
| ErrorStateView | message, retryTitle?, retry?; triangle icon + retry button |
| KPICard | title, value; used in HomeDashboardView KPI grid |
| SectionHeaderView | title; headline-style section header |
| FilterChip | title, selected, action; capsule filter (used in Reports, Tasks) |

## Usage

- Dashboard: LoadingStateView, ErrorStateView, KPICard.
- Team: LoadingStateView, ErrorStateView, EmptyStateView.
- Reports: Same + FilterChip, ReportRowView (inline).
- Tasks: Same + FilterChip, TaskRowView (inline).
- AI: LoadingStateView, ErrorStateView, EmptyStateView.

## Not yet added (optional Phase 3)

- Alert banner, project status card, worker activity row (custom), report preview card, AI insight card, primary/secondary manager buttons (currently using system .borderedProminent / .bordered), skeleton loading.
