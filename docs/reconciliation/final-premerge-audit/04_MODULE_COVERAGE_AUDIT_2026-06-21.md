# Module Coverage Audit — 2026-06-21

|Module|Current in main|Current in PR109|Missing branches|Remaining tails|Recommendation|
|---|---|---|---|---|---|
|Web public site|YES|PARTIAL|release/web-pilot-rc; design/liquid-glass-public-shell-lg2a|P1 visible redesign outside PR|Audit/port public/brand slice later; no merge wholesale|
|Dashboard/frontend|YES|YES for reports/subnav slices|release/web-pilot-rc|P1 broader nav/design still open|Continue small slices only|
|Reports/export/review|YES|YES|release/mobile-pilot-rc had related ideas|No P0; side effects deferred|Merge candidate scope clean|
|Owner/customer/stakeholder|YES/PARTIAL|NO new exposure|release/web-pilot-rc owner/client polish|P0 finance isolation risk|Defer; audit finance-safe portal separately|
|Auth/RBAC/security|YES|YES for export/review guards|hotfix/p0 branches|P1 middleware/security branches not merged|Manual middleware/auth comparison later|
|Database/migrations/contracts|YES|NO migrations changed|AI branches contain missing migrations|P0 if applied blindly|Defer AI migrations/live DB review|
|AI/Flywheel|PARTIAL|NO integration|ai/* branches|P0 migrations/RLS/runtime|Defer|
|Mobile|PARTIAL|NO integration|release/mobile-pilot-rc|P1/P2 mobile API/build assumptions|Defer mobile audit|
|Release/ops/CI|YES|Docs/status only|release/ops branches|P1 smoke/live gates still needed|CI green; staging/live smoke before merge|
