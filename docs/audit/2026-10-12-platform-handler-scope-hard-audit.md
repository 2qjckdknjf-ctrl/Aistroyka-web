# Queue follow-up audit — 2026-10-12

Read-only source/live trigger inspection confirms further existing queue defects that precede durable report result work:

1. retention_cleanup derives target tenant from payload instead of server job identity; push_send drains all tenants; upload_reconcile selects and mutates sessions without tenant scope or a current-state CAS. Live jobs INSERT policy permits internal tenant writers, and the installed payload trigger checks only project_id. Existing update guard does not fix handler-side targets. Fix handler scope, mismatch rejection, reconciliation-state race and no-scope fail-closed contracts without live sends or DDL.
2. claim_jobs increments attempts before returning rows while processJobs adds one again for retry/dead thresholds. The last configured attempt must be exercised with the live RPC semantics.
3. The processor batch break on exhausted budget leaves untouched claimed rows running; it must release exact unstarted leases without reporting execution. No stale lease sweeper was found. Persistent transport loss needs a separate governed recovery contract, not a claim that #442 solves all queue crashes.
4. Report media output remains discarded. Its contract must support both real media-backed and upload-session-only attachments, reuse provider/source/result modules, preserve current ai_analysis mandatory media/FK contracts, and gate Graph promotion on explicit human review.

Proceed as focused protected slices from fresh main. Preserve all applied SQL and historical analysis job_events. No new fake tenant/media rows or live external messages for QA.
