# Media and analysis RLS continuation

Baseline 2d5e44ba, CURRENT_BASELINE. #420 image/session security is merged; scoped completion/failure migration is applied as remote 20261011112358. Staging/production publication checks are ongoing.

Fresh live metadata shows media_tenant and ai_analysis_tenant FOR ALL policies accepting any tenant membership. media has only URL-immutability and tenant-on-insert triggers; neither denies stakeholder/viewer deletes or result forgery. Old #206 has a relevant project-scoped portal read policy, but incorrectly uses internal readers for writes and reopens analysis_jobs client writes. Do not broad-merge it.

Slice: preserve member/admin/owner media writes and viewer reads; permit active portal grants only for their own project's media; deny viewer/stakeholder media writes, identity transfers, and all client writes to AI results. Preserve existing analysis_jobs lockdown. Apply account suspension checks using the already verified private account helper. Accepted-grant status semantics remain as implemented; invitation expires_at is not reinterpreted as a new lifetime restriction.

Validate current vulnerability on synthetic native fixtures, then RLS roles/cross-project/revocation/account suspension and positive member/service completion flows. No real media or result writes/deletes for probes. Fresh receipt guard, independent current-head review, required CI and protected merge precede new live SQL.
