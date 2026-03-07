# Assignee Identity Improvement (Phase 4)

**Date:** 2026-03-07  
**Scope:** Optional enrichment of worker/assignee display in task assign flow.

---

## Current state

- **GET /api/v1/workers** returns: user_id, last_day_date, last_started_at, last_ended_at, last_report_submitted_at, anomalies (open_shift, overtime, no_activity).
- **Task assign UI** uses this list as assignee picker; shows user_id (UUID) or a short prefix. No display name, role label, or avatar.

## Backend options

- **No profiles table** in current schema; auth.users is not queried from anon/client context for listing.
- **Minimal improvement:** Add a `profiles` table (id, display_name, avatar_url) and populate from auth hook or onboarding; then extend GET /api/v1/workers to join and return display_name (and optionally role from tenant_members). Requires migration + worker-list.repository change.
- **Alternative:** GET /api/v1/workers/directory that returns assignable users with display_name when profile exists; fallback to user_id.

## Recommendation

- Phase 4: No backend change; assign flow remains functional with user_id. Document as optional improvement.
- Phase 5: Introduce profiles or directory endpoint and show display_name in assignee picker and task detail.
