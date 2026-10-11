# Task: production provider-secret deploy race

Baseline 76579633. Production workflow 38128504540 failed while persisting AI provider secrets after the reviewed code deployment: Cloudflare rejected secret edit because latest Worker version was not deployed. Independent Workers Builds can create a newer inactive version in that interval. Existing production source may already have deployed despite overall workflow failure; verify health and blocking post-deploy gates separately.

Goal: deploy the reviewed patched bundle and the existing approved provider-secret values in one operation, without deploying an unrelated inactive version or relying on repeated secret writes. Preserve environment routing, build SHA/time, protected promotion guard and post-deploy checks. No new provider keys or rotation are requested.

Acceptance: pinned deployment CLI supports the atomic secret-file flag; ephemeral provider-secret file is private and cleaned up on success/failure; values do not enter command arguments or logs; omitted secrets remain on Worker; required CI/current-head non-author review/protected merge, then staging/production deployment and smoke proof. Owner already authorized autonomous operations.

Also record the completed live DB slice and duplicate closure in the final operational handoff; remaining semantic queue and product gates are not implied complete by this change.
