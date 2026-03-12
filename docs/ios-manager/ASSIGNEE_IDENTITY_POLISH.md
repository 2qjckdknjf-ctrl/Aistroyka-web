# Assignee Identity Polish (Phase 5)

**Date:** 2026-03-07  
**Scope:** Assignee picker UX without inventing fake data.

---

## Backend state

- GET /api/v1/workers returns: user_id, last_day_date, last_started_at, last_ended_at, last_report_submitted_at, anomalies. No display_name or profile (no profiles table).

## Implemented

- **Picker rows:** Two-line row: primary = truncated user_id (first 8 chars + "…" when long) for scannability; subtitle = "Last report: <date>" when lastReportSubmittedAt present, else "Last day: <date>" when lastDayDate present. Real data only.
- **Current assignee:** Checkmark and medium font weight for the selected worker; same as before, clearer hierarchy.
- **Assignment confirmation:** After successful assign, task detail shows "Assigned" with checkmark for 2.5s then clears. Inline; no toast dependency.

## Not implemented (no backend)

- Display name, role label, avatar: require profiles or enriched workers API; documented in ASSIGNEE_IDENTITY_IMPROVEMENT.md for future.
