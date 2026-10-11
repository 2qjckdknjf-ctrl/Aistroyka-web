# Continuation state — 2026-10-11

Canonical path: /Users/alex/Projects/AISTROYKA-main-clean. Refresh origin/main and run workspace_preflight; dated SHA 729126d4 is an observation only.

Completed: #410 intake runbook/evidence; #413 direct database status-transition guard. Both protected merges after current-head reviewer 6262265-cpu approval and required CI. #347/#351 are closed/included; #317/#348/#352 are closed/superseded. Branches preserved.

Actual defect reproduced and fixed locally: creator could change submitted -> withdrawn/draft via direct table writes. New additive migration 20261011080113_harden_customer_intake_status_transitions.sql permits only draft -> submitted/withdrawn, requires client inserts to start draft, preserves same-state retries, content edits and service maintenance. It depends on the existing intake table migration.

Evidence: 34 sequential PostgreSQL/RLS checks PASS with PGlite 0.5.8 and synthetic prerequisites; 94 intake/finance and 27 queue/summary/video/resolver Vitest PASS. Single-connection tests do not prove concurrent RPC races or live PostgREST behavior. Harness and result JSON committed.

Remote database unchanged. Live AISTROYKA RPC remains 3-arg; intake table absent. Staging client points to the same production database; no development branch existed on read-only inspection. Permission to create an isolated test branch and verify migrations is pending. Do not apply live changes under a generic continue instruction.

Existing SQL to verify in dependency order: 20261003170000_customer_intake_drafts.sql, 20261004180000_create_analysis_job_request_key.sql, 20261011080113_harden_customer_intake_status_transitions.sql. Run RPC concurrency, tenant/media mismatch, role EXECUTE negatives, and intake ownership/revocation/account/status negatives before any separately approved live apply.

Reviewer credential available in canonical .env.local; Chrome unlock is no longer needed. Preserve private env backup; never print secrets or archive contents.
