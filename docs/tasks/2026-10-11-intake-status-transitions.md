# Intake status transition integrity — 2026-10-11

Local PostgreSQL reproduction: authenticated creator directly updates submitted -> withdrawn -> draft through table permissions; API submit/withdraw rejects these transitions. Existing RLS scopes ownership but does not enforce lifecycle.

Add a separate migration after customer_intake_drafts creation: non-service callers insert only draft and may transition draft to submitted or withdrawn; terminal status changes fail with 23514. Same-state retries and content edits remain valid. Service-role maintenance remains available. No existing migration rewritten; no remote apply.

Validation: actual SQL executed in PGlite 0.5.8, 34 sequential checks PASS. Synthetic prerequisite schema; concurrency and live PostgREST are not certified. Run harness copied to a temporary directory with @electric-sql/pglite@0.5.8 installed, then bun verify_intake_lifecycle_postgres.mjs /absolute/repository/path.

Required CI and independent current-head review remain merge gates. Live DB apply awaits separate explicit permission and staging isolation.
