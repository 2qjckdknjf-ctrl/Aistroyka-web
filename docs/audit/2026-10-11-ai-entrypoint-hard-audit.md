# AI entry-point hard audit — 2026-10-11

Baseline e03cb5a. Verdict: block new AI capabilities pending repair of existing authorization. This is a focused source audit, not a whole-AI readiness certificate.

1. Image analysis: canonical and legacy routes accept unscoped anonymous calls; null tenant skips policy and quota attribution. Repair requires tenant membership and the existing analysis:trigger permission before configuration/body/provider work. Project/media identifiers use the caller's RLS client and tenant, including deriving the project from media-only requests. Legacy delegates to canonical, preserving deprecation headers.
2. Legacy analysis/process: any cookie-authenticated user can invoke global service-role dequeue. Follow-up must select caller-visible queued jobs and atomically claim inside that tenant; no public cron-secret authorization bypass is accepted. Do not run a live processing probe against real queued jobs.
3. Video anonymous access: already repaired in #386; the existing 9-test video route suite passes alongside this image change. Full video role/media binding remains subject to the wider matrix.
4. Deployment evidence: strict live-provider smoke previously allowed direct local provider success after a failed app request. The strict gate now accepts only the authenticated app response with the full AnalysisResult shape and no fallback header, without forwarding bearer credentials through redirects. Deployment workflows use existing pilot credentials. A direct provider call is an explicitly enabled non-strict diagnostic only.

Validation before PR: 55 route tests PASS (22 new canonical/legacy authorization cases); five hermetic strict smoke boundary tests PASS; targeted ESLint and web TypeScript PASS. Stale generated Next type output was moved to a private archive before typecheck; source files were not changed to satisfy stale output. Required CI/review/publication remain subsequent evidence.

The stale #200 branch is retained for semantic comparison. Its image, video and global-worker changes must not be broad-merged over current Vision implementations. Close #200 only after both outstanding repairs are integrated and verified.
