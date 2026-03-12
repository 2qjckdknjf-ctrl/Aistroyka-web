# Alerts Center UI

## Overview

A single coherent surface for workflow, AI, and platform alerts.

## Surfaces

1. **Dashboard home** — Section "Intelligence & Alerts" with AlertFeed (last 10 alerts) and link to full Alerts page.
2. **/dashboard/alerts** — Full Alerts page with AlertFeed (up to 50). Sidebar link "Alerts" in dashboard nav.

## API

- **GET /api/v1/alerts?limit=50&unresolved=false** — Tenant-scoped list. Uses existing `listAlerts` (lib/sre/alert.service). Same table as admin alerts; tenant filter applied.

## Display

- **AlertFeed** shows: message, type, severity (with border color: critical=error, warn=amber, info=info), created_at.
- Empty state: "No alerts".

## What is real vs partial

- **Real:** Tenant-scoped list, dashboard home widget, dedicated page, sidebar link. Data from existing alerts table.
- **Partial:** Platform alerts (workflow/ai_brain/copilot from lib/audit/alert.service) write to the same table with type=source; SRE alerts use different types. No filtering by source in UI yet; no resolve/dismiss actions.
