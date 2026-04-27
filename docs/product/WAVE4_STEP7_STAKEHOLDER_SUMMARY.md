# Wave 4 Step 7 — External stakeholder identity — Summary

## Shipped

- **`project_stakeholders`** with `client_viewer` / `client_decision_maker`, invite token, lifecycle.
- **Accept** → `tenant_members(viewer)` when needed + `active` stakeholder row.
- **Policy**: read portal vs respond to requests decoupled from “owner only.”
- **APIs**: invite, list, revoke, accept; project GET exposes `stakeholder_role`.
- **UI**: `StakeholderManagerPanel`, `/dashboard/stakeholder-invite`, portal link for stakeholders, respond gated by capabilities.

## Doc index

1. `WAVE4_STEP7_STAKEHOLDER_ACCESS_INVENTORY.md`
2. `WAVE4_STEP7_STAKEHOLDER_ACCESS_BACKEND_REPORT.md`
3. `WAVE4_STEP7_STAKEHOLDER_ACCESS_POLICY_REPORT.md`
4. `WAVE4_STEP7_STAKEHOLDER_MANAGER_UI_REPORT.md`
5. `WAVE4_STEP7_STAKEHOLDER_CLIENT_UI_REPORT.md`
6. `WAVE4_STEP7_STAKEHOLDER_INTEGRATION_REPORT.md`
7. `WAVE4_STEP7_STAKEHOLDER_VALIDATION_REPORT.md`
8. `WAVE4_STEP7_STAKEHOLDER_POST_AUDIT.md`
9. `WAVE4_STEP7_STAKEHOLDER_SUMMARY.md` (this file)
