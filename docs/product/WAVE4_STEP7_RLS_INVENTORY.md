# Wave 4 Step 7 — RLS / data-plane inventory

**Date:** 2026-03-29

## A1 — Stakeholder-visible flows (portal)

| Data path | Tables touched (typical) |
|-----------|-------------------------|
| Client portal view | `projects`, `project_milestones`, `project_documents`, `project_cost_items`, `worker_*` (counts), `project_client_requests`, media/analysis (if present) |
| Client requests | `project_client_requests`, `project_client_request_events` |
| Invite / accept | `project_stakeholders`, `tenant_members` |

## A2 — Prior leak pattern

Any policy of the form:

`tenant_id in (select tenant_id from tenant_members where user_id = auth.uid())`

**without** a role filter allowed **any** `tenant_members` row — including **`stakeholder`** — to satisfy the predicate for **full tenant** reads, even when the table was **not** portal-scoped.

## A3 — Main leak paths (before)

1. **Tenant-wide tables** (AI, plan fit, jobs, sync, idempotency, ops, photo, identity SSO, entitlements, etc.) — stakeholder could `SELECT` like an internal member.
2. **Project-scoped tables** — same predicate, so **all projects** in the tenant were visible, not only `project_stakeholders` projects.
3. **Legacy `viewer`** on `tenant_members` for users who accepted before the `stakeholder` role existed — **broader** app semantics than portal-only.

## A4 — Migrations addressing this

| Migration | Scope |
|-----------|--------|
| `20260330170000_stakeholder_rls_isolation.sql` | Helper functions; legacy `viewer`→`stakeholder` UPDATE; projects + project-scoped tables; workers; client requests; AI/plan_fit subset; billing readiness; manager_notifications |
| `20260330180000_stakeholder_rls_remaining.sql` | Sync engine, jobs, user_scopes, idempotency, ops_events, tenant_feature_flags, tenant_data_plane, entitlements, audit_logs insert |
| `20260330190000_stakeholder_rls_identity_export_photo.sql` | Identity providers, export batches/rows, photo annotations/comments |

## A5 — Residual / follow-up

- Historical migration **files** in the repo still contain old SQL text; **effective** policies are those created by the **latest** applied migration in order.
- Tables that **only** had admin/owner policies already (e.g. some SLO alerts) were left unchanged unless a broad `tenant_members` clause was present.
- **Apply** these migrations in non-local environments before relying on data-plane isolation.
