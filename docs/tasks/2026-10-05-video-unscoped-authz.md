# Close anonymous unscoped video daily analysis — 2026-10-05

Branch: `fix/ai-video-unscoped-authz-2026-10-05` from current `origin/main`.

Goal: stop unauthenticated Gemini `analyze-video-daily` calls. Scoped `project_id` authz is already in main; remaining hole is omitting `project_id` to skip `requireTenant` and tenant quota.

Acceptance:

- Unauthenticated POST (legacy `/api/ai` and `/api/v1/ai`) returns 401 before provider call.
- Authenticated tenant without `project_id` may still run analysis; quota applies.
- `project_id` still requires internal project access (403/404 unchanged).

Does not apply migrations. Does not close PR #317 (old restack); this slice is the remaining A1 hole on current main.
