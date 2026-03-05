# ADR-059: Push send stubbed without credentials

**Status:** Accepted  
**Decision:** Push outbox and enqueue implemented. APNs/FCM send stubbed: return false when credentials not set. Document clearly; implement send when `APNS_*` or `FCM_*` configured.
