# Customer functional device closure

Initial baseline 71899f43; reconciled through current main 0bc5d602. Existing Customer target/API/CRUD reused. On physical iPhone 17 Pro, functional Debug flow passed 1/1:real sign-in, allowed project/detail, project-bound intake persisted, exact synthetic grant revoked,404 refresh removes cached content/actions, sign-out. Shared contracts 17/17 PASS. Private DEBUG credential prefill was explicit; manual keyboard entry and store/pilot artifact remain separate.

Fixes and cleanup are recorded in [closure report](../reports/2026-10-11-customer-device-and-storage-closure.md). Temporary fixture and sessions cleaned; credentials removed from runner. No new tenant/email invite/provider or real business-row write. App supports iOS 16; conditional 16.4 bounce plus explicit refresh make short project views usable. API access denial discards cached content; generation guards prevent an earlier response replacing a later denial. en/ru/es/it copy updated.

This source awaits its protected PR delivery; no further fixture exists to rerun without recreating a controlled test fixture. Private result archive and tested source hashes are preserved. Next work follows Owner/evidence/hard-audit dependencies, not a repeated Customer target or manual CRUD implementation.
