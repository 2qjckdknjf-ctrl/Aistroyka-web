# AI security continuation — 2026-10-11

## Delivered #420

PR HEAD 9656a4f82fff3cce8c65adad5aeac79337242c0a; integration 2d5e44ba7853a3f5afb10dc8bd50e73d93ddf5bf. Required CI 38135078209 SUCCESS, independent current-head approval, all review findings resolved before protected merge.

Image analysis (canonical/legacy) requires tenant analysis:trigger; project/media references are caller-RLS scoped. Session processing uses caller-visible due jobs, an atomic tenant/execution claim and trusted image callback auth (same-origin or exact HTTPS production apex/www only). No global session dequeue or cron-secret bypass. Completion/failure are bound to tenant and execution token. Strict provider proof accepts only the authenticated deployed app with full result shape and no fallback.

Migration source 20261011110418_complete_session_analysis_job.sql applied as remote 20261011112358 session_analysis_job_scope_20261011. Live service EXECUTE true, anon/authenticated false; SECURITY INVOKER and search_path=pg_catalog. Nonexistent-job REST probes: client permission denied; service scope denied. No real queued job was processed. Existing live next_retry_at was preserved; fresh bootstrap gains the missing column. Legacy completion overloads remain for compatibility; new caller does not use them.

Staging workflow 38135373240 and production 38135618452 SUCCESS. Actual canonical AI gate step SUCCESS on each: live_provider_call_succeeded=true, llm_success_count=1, fallback_count=0. Health on staging, apex and www: HTTP200 buildStamp.sha7=2d5e44b. Anonymous canonical/legacy image and process calls: twelve checks, all HTTP401. Existing blocking pilot, security-header and stakeholder-finance workflow gates pass. This is the scoped entry-point/runtime evidence, not a complete AI capability certificate.

Local: 114 focused app tests across the delivered suites; five smoke-proof tests; 16 SQL session contracts; ten native PostgreSQL17.10/PostgREST14.5 checks including one winner from 40 simultaneous claims. Review corrected callback dependencies, apex/www compatibility and clean-schema drift. Native copied affected metadata with synthetic rows; unrelated policies/Auth service were not a full production clone.

## Next scoped fix: media/results RLS

Live metadata confirms media_tenant and ai_analysis_tenant FOR ALL policies using any tenant membership. Synthetic native reproduction: stakeholder reads/deletes another project's media; viewer changes an AI result. No real media/result mutation used for audit. #206 is re-sliced rather than broad-merged: its reader-based writes and reopened analysis_jobs writes are rejected.

Proposed migration preserves internal media CRUD (owner/admin/member), viewer reads and active-grant enabled-project portal reads; denies read-only role writes, identity transfers and client AI-result writes. Suspended account blocks ordinary data access through the verified private account guard. Analysis_jobs protection is preserved. Accepted status is the existing grant contract; invitation expires_at is not converted into a new accepted-grant lifetime rule.

Evidence: 26 PGlite role/scope checks and 21 native setup/session/media checks PASS, with before/after vulnerability proof, revoked/disabled portal, suspension, multi-tenant identity transfer, member metadata/upload and service completion positives. The new migration is pending protected CI/review/integration and live apply; do not report it as deployed yet.

## Readiness facts

Physical iPhone17Pro is paired, booted and accessible. Worker1.0 and Manager4.3.0 are installed; Customer absent. Installed versions do not prove current source or complete device smoke. Continue mobile functional verification on current approved sources; store candidates still follow the designated release branch and signing gates.

Security repair precedes AIS-CLIENT-005A extraction. Manual intake, Customer targets, async Vision and Graph persistence already exist. Full portal/export/Graph/Vision/device/distribution/legal/billing and remaining semantic PR reconciliation must be verified separately; no whole-project completion claim.

## #421 delivery and live checks

#421 protected merge c25c8e0da5541707f623d4ba793a8b36c934480a, HEAD 9537188db75d3f9c06da454364ce16d170292137; required CI38136218256 SUCCESS, independent current-head APPROVED, no unresolved findings. New 42 session/media SQL contracts run in CI. Source 20261011112701_harden_media_analysis_access.sql applied as remote20261011114415; seven verified source files under six remote IDs. Live client AI-result INSERT/UPDATE/DELETE privileges false, service INSERT true; scoped media policies and identity trigger confirmed; analysis_jobs SELECT-only retained.

Live owner probe used an isolated task-created project and media. Owner media create/metadata edit PASS; client identity change and AI-result POST/PATCH/DELETE all403/42501. Exact synthetic media/project deleted and absence verified; existing business records unchanged. Initial configured E2E project did not belong to this smoke actor's primary tenant, so that probe stopped before writing; a separate exact synthetic fixture avoided touching another project's data.

Staging38136611642 and production38136807807 SUCCESS. Production canonical AI step GO, live success true, fallback_count0. Production health c25c8e0. Whole AI/portal capability closure remains separate.

Physical Customer Debug build succeeded, but first test runner initialization failed with device authentication canceled. Device inventory still did not show the main app, so installation and smoke were not claimed. Owner now confirmed device ready; a fresh test result bundle is being generated. This is functional Debug QA, not a store/pilot release artifact.

## Video permission follow-up

Unscoped video analysis lacked analysis:trigger, typed service-token403 and media binding. Reuse caller-RLS project/media resolution across image/video, enforce the existing permission before provider configuration, and retain tenant quota. 75 targeted route tests PASS (20 new canonical/legacy video permission cases) plus TypeScript/lint. No new provider or capability. Runtime verification follows protected delivery.
