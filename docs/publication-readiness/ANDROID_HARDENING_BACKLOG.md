# Android Hardening Backlog (Deferred Track)

## Policy

- Android is not part of first public release claim.
- Any Android readiness statement must reference this backlog and its closure evidence.

## Minimum closure gates before Android beta claim

1. **CI gate parity**
   - PR-triggered Android smoke workflow (not only `workflow_dispatch`).
   - Manager + Worker instrumented launch checks.
2. **Runtime pilot proof**
   - Login + projects + report submit on pilot tenant.
   - Manager inbox/review path on pilot tenant.
3. **Sync/offline parity**
   - Durable offline queue parity for Worker (or explicit product limitation in release notes).
   - 409 conflict reconciliation verified end-to-end.
4. **Release operations**
   - Signing + closed testing track setup.
   - Crash monitoring and rollback playbook validated.

## Evidence artifacts

- `docs/publication-readiness/STAGE_15_ANDROID_SCOPE_LOCK_REPORT.md`
- `docs/publication-readiness/KNOWN_LIMITATIONS.md`
- `docs/mobile/MOBILE_E2E_WORKER_MANAGER_SYSTEM_TEST.md`
