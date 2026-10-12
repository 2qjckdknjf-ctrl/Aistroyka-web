# Platform job execution lease — 2026-10-12

Before durable report-result writes, platform jobs also need safe lifecycle acknowledgements. Existing markSuccess/retry/dead updates matched only job ID. A late handler could clear a replacement worker's lease and report success or failure for its attempt. The existing session analysis engine has its own guarded completion; this repair applies to public.jobs through the current DB queue adapter.

Updates now match job/tenant, running state, worker ID, exact locked_at string and attempt number, then require row readback. Missing/foreign/replaced claims fail closed. The processor checks current ownership before dispatch, reports events/counts only after successful state transition, and releases acquired tenant slots even after losing its claim. No new queue or live DDL.

Validation: 26 claim/processor/media-handler cases PASS, including actual SDK filter encoding. TypeScript/scoped lint PASS. An isolated native PostgreSQL 17 harness ran the bundled actual repository and SDK against atomic SQL predicates: two acknowledgements have one winner; a microsecond-later same-worker lease rejects success/dead/retry; foreign tenant remains unchanged; successful retry clears only its lease. Four native contracts PASS; local server stopped afterward. Private harness/data are synthetic and were not uploaded.

Protected CI/review and live staging state-transition verification remain required. This is a prerequisite for result persistence, not proof that report media AI output is already stored or reviewed. See the report-result hard audit on main.
