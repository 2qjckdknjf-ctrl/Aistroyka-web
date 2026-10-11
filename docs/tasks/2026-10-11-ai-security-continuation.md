# AI security continuation — 2026-10-11

Owner instruction: continue autonomously through the current development plan, reconcile implemented work before adding scope.

Baseline: e03cb5a4cf7a2ab53708a4ec5194fea6fe005cd2. Workspace preflight: CURRENT_BASELINE, clean.

Fresh hard audit verdict: BLOCK new AI capabilities until existing entry-point authorization is repaired. Both image endpoints permit anonymous unscoped paid calls. The legacy session job processor uses service-role global dequeue. PR #200 identifies these gaps but is stale; its cron bypass is not accepted as a general authorization substitute. Video anonymous access is already fixed by #386 and will be regression-tested.

First slice: authenticated tenant image analysis, canonical/legacy parity, project/media authorization, authenticated deployment probes without direct-provider success masking deployment failures. Follow-up: constrain the legacy job processor to caller-visible jobs with atomic tenant-scoped claims. Preserve the primary async Vision implementation and existing client contracts.

Validation: negative anonymous/missing-membership/service/stakeholder/cross-project cases; positive authorized analysis and quota/fallback paths; relevant unit/type/lint checks; required CI, independent current-head review, protected merge, staging/production runtime proof. No real queued jobs will be processed for a security probe.

Full readiness remains subject to the current roadmap's portal, scope extraction, Graph, physical-device, distribution, legal, and billing evidence. This task is not a full-project completion claim.
