# Task: live database operator-runbook closure

Baseline 5a13e652. #415/#416/#417/#418 are merged, DB changes are applied and verified, and the receipt guard prevents replay even after renaming SQL. Final current-runbook sweep found CUSTOMER_INTAKE.md still describing the pre-grant missing table. Replace that current section with the actual live table/lifecycle/private-helper/index state and remote receipt mapping; distinguish the RPC contract's historical pre-apply snapshot from the completed live operation.

Docs only; no source SQL, app, credentials, workflow or database changes. Owner already authorized the completed operational slice. Acceptance: no current absent-table/permission-pending claim, correct receipt/report links, protected review/CI/merge; retain historical observations as dated evidence.
