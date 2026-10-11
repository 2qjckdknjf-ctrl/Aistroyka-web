# Tenant-scoped legacy AI processing

Baseline: e03cb5a from origin/main, clean CURRENT_BASELINE. Source audit of PR #200 confirms the session-facing global service-role dequeue remains unfixed. #420 includes both image entry-point authorization and this callback repair, following review dependency evidence.

Continue the existing legacy worker with caller-RLS candidate reads and atomic queued → processing/execution claim scoped by tenant and job identity. Never use global dequeue from this session path. Require analysis:trigger permission, preserve the existing upload-triggered member workflow and legacy response headers, and forward user auth only to a same-origin canonical image endpoint with redirects disabled.

Test missing membership/role/service token, foreign candidates/media, lost claims/concurrency, retry timing and credential forwarding. Inspect the live RPC/trigger contracts read-only; no real jobs are processed and an additive service-only completion/failure RPC migration fixes proven live overload ambiguity without billing/capacity changes. Required CI, independent review and runtime proof follow.
