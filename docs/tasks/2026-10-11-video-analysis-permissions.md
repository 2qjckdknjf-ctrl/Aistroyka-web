# Video analysis permission parity

Baseline c25c8e0d, CURRENT_BASELINE. #420 and #421 are merged. Media/result RLS source applied as remote 20261011114415; live owner metadata CRUD and identity/result-write denial verified on exact synthetic rows, both media and project cleaned up.

Fresh code audit: video denies anonymous callers but does not enforce analysis:trigger for unscoped viewer/stakeholder calls, does not handle service-token TenantForbiddenError as HTTP403, and does not validate media_id against the caller's project/tenant. Image already covers these boundaries. Preserve the existing daily-work contract and tenant quota. Share the existing project/media scope validation between the two endpoints rather than maintain divergent checks.

No new AI capabilities or provider configuration. Verify canonical/legacy parity, read-only roles, service token, media/project mismatch and authorized member positives; required CI/review/protected delivery. Record #421 receipt and physical Customer test interruption honestly. The iPhone canceled runner authentication; Customer is built but installation/physical smoke is not yet confirmed. Await device readiness reply before retrying dependent UI automation; continue server work.
