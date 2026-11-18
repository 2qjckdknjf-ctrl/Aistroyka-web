# Customer portal intake PATCH — 2026-10-05

Branch: `feature/customer-portal-intake-patch-2026-10-05` from current `origin/main`.

Goal: expose existing `updateCustomerIntakeDraft` over `PATCH /api/v1/portal/intake/:id` and let Customer iOS edit a listed draft. Live `customer_intake_drafts` apply remains OWNER_GATE.

Acceptance:

- PATCH requires tenant auth; `tenant_id`/`created_by` stay immutable.
- Update denied (other creator / other tenant) is 403.
- Authenticated stakeholder still needs `x-tenant-id` or `project_id` like GET/POST.
- Customer iOS can load a draft into the form and save via PATCH.

Does not apply the intake table migration.
