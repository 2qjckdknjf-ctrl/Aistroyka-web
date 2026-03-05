# ADR-039: Release runbook and smoke scripts

**Status:** Accepted  
**Decision:** docs/RELEASE-RUNBOOK.md: rollout steps, rollback steps, incident handling, how to freeze flags. Scripts: scripts/smoke-v1.sh (health), scripts/smoke-mobile.sh (sync bootstrap with x-device-id), scripts/smoke-admin.sh (config, SLO overview). CI-friendly; BASE_URL and AUTH_HEADER env for authenticated smoke.

**Context:** Phase 5.8; safe releases.

**Consequences:** Staged deploy support and automated smoke matrix for v1, mobile, admin.
