# Platform job event storage hard audit — 2026-10-12

Verdict: LIVE_TABLE_NAME_COLLISION / REUSE_EXISTING_AUDIT_STORE. Current platform repository inserts job_id/event/details into job_events. Live information_schema shows job_id/worker_id/event_type/payload/created_at, and pg_constraint shows job_id references analysis_jobs, not jobs. Merely renaming fields would still violate the live FK. Existing insert errors are ignored, so platform lifecycle events are not durable.

Do not rewrite the deployed job_events table or its analysis-engine history. Reuse existing audit_logs with resource_type platform_job, resource_id job.id, tenant/user/trace from the server-returned job. Record bounded event/type/status/attempt metadata and safe error category; exclude raw provider errors, payloads and signed URLs. Wait for the bounded write before returning. Existing audit read policy is owner/admin-only; stakeholder access remains denied. No DDL or new event queue is needed.

Implementation is included in the protected lease repair #442. Required proof: actual SDK insert contract, failure does not revert a successful job transition, live processor on one exact synthetic sentinel with an otherwise empty QA-tenant runnable queue, durable locked/success readback and exact job cleanup. Audit history is retained. The sentinel is not evidence of stored/reviewed report AI output.
