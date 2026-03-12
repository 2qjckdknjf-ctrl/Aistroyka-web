# Executive Intelligence UI

## Overview

Executive-facing blocks use the same project-scoped intelligence API. There is no separate portfolio aggregation yet.

## Current placement

- **Executive Summary** — Shown in the project Intelligence tab (SummaryCard with headline, summary, topRisks, recommendedActions, metrics). Source: `getExecutiveSummaryForProject`.
- **Project Status** — Reflected by Project Health, Risk Radar, Evidence and Reporting panels on the same tab.

## Portfolio scope

- **Not implemented:** Portfolio-level risk snapshot or multi-project executive view. Dashboard home shows a CTA "Open a project → Intelligence tab" and an Alerts feed.
- **Extension point:** When portfolio or multi-project APIs exist, add a dashboard home widget that fetches aggregated executive summary and risk counts; reuse SummaryCard and RiskList.

## Critical Alerts

- **Alerts** are tenant-scoped and shown on dashboard home (AlertFeed) and on **/dashboard/alerts**. Source: GET /api/v1/alerts (listAlerts). No distinction yet between "executive" vs "manager" alerts; role gating is TODO.
