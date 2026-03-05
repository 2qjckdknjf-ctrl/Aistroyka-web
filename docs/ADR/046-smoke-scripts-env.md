# ADR-046: Smoke scripts environment variables

**Status:** Accepted  
**Decision:** Smoke scripts use BASE_URL (default localhost:3000) and AUTH_HEADER (Bearer token). Optional DEVICE_ID for mobile. No secrets in scripts; CI sets AUTH_HEADER for authenticated smoke. Scripts exit 0 when auth missing (skip authenticated steps).

**Context:** Phase 5.8 CI-friendly smoke.
