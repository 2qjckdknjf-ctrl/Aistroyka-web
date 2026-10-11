# AI entry-point hard audit — 2026-10-11

Baseline e03cb5a. Verdict: block new AI capabilities pending repair of existing authorization. This is a focused source audit, not a whole-AI readiness certificate.

1. Image analysis: canonical and legacy routes accept unscoped anonymous calls; null tenant skips policy and quota attribution. Repair requires tenant membership and the existing analysis:trigger permission before configuration/body/provider work. Project/media identifiers use the caller's RLS client and tenant, including deriving the project from media-only requests. Legacy delegates to canonical, preserving deprecation headers.
2. Legacy analysis/process: any cookie-authenticated user can invoke global service-role dequeue. The repair selects caller-visible, retry-due queued jobs and atomically claims processing/execution inside that tenant; no public cron-secret authorization bypass is accepted. Do not run a live processing probe against real queued jobs.
3. Video anonymous access: already repaired in #386; the existing 9-test video route suite passes alongside this image change. Full video role/media binding remains subject to the wider matrix.
4. Deployment evidence: strict live-provider smoke previously allowed direct local provider success after a failed app request. The strict gate now accepts only the authenticated app response with the full AnalysisResult shape and no fallback header, without forwarding bearer credentials through redirects. Deployment workflows use existing pilot credentials. A direct provider call is an explicitly enabled non-strict diagnostic only.

Validation before PR: 55 route tests PASS (22 new canonical/legacy authorization cases); five hermetic strict smoke boundary tests PASS; targeted ESLint and web TypeScript PASS. Stale generated Next type output was moved to a private archive before typecheck; source files were not changed to satisfy stale output. Required CI/review/publication remain subsequent evidence.

The stale #200 branch is retained for semantic comparison. Its image, video and global-worker changes must not be broad-merged over current Vision implementations. Close #200 only after the combined image and worker repairs are integrated and verified.

## Combined repair evidence

Review correctly identified that image authentication and the legacy callback must ship together. The worker now carries user auth only to a same-origin canonical/legacy image URL, with redirects disabled. The existing member upload-triggered flow uses analysis:trigger. Viewer/stakeholder/service-token session calls are denied. Candidate reads use the caller RLS client; service claims enforce tenant, queued state, no execution token and retry due time. Claim losers do not fail the winner's job. Degraded image fallback is not accepted as a completed job.

Read-only live metadata and a deliberately nonexistent job probe exposed two legacy complete_analysis_job overloads: the seven-key REST call returns PGRST203. The additive migration creates unambiguous SECURITY INVOKER service-only completion/failure RPCs bound to tenant and execution token. Completion retains the seven-argument result/terminal semantics, with no new legacy capacity/billing side effects; failure calls existing accounting under a scoped row lock. Stale callbacks cannot alter a replacement execution owner.

Local evidence: 102 targeted API/worker tests, five hermetic strict smoke checks, 15 isolated PGlite SQL contract checks, ten native PostgreSQL 17.10/PostgREST 14.5 setup and scope checks (including one winner from 40 competing claims), targeted ESLint and TypeScript PASS. Native fixtures copied affected metadata/helpers/triggers with synthetic rows only, not the complete production schema/Auth service. Migration receipt guard against fresh project history reports CANDIDATE_NOT_PROVEN_APPLIED; live apply remains pending protected review/integration. No real queued jobs were processed.
