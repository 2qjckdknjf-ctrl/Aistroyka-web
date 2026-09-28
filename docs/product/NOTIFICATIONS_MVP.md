# Notifications / Reminders — MVP Scope

**Step:** NOTIFICATIONS / REMINDERS — MVP  
**Closure:** 2025-03-23

## Scope

Minimal workflow notifications layer using existing `manager_notifications` table. No realtime, no push, no email.

## Model

`manager_notifications`: id, tenant_id, user_id, type, title, body, read_at, target_type, target_id, project_id, created_at.

## Event types and recipient targeting

| Event | Type | Recipients |
|-------|------|------------|
| Issue created | issue_created | Tenant managers (owner, admin, member) |
| Issue in_review/resolved/closed | issue_status_changed | Tenant managers |
| Document under_review | document_under_review | **Owner-side** (tenant owner + role=owner) |
| Owner decision (approve/reject/request_changes) | document_owner_decision | Tenant managers |
| Manager resubmit | document_resubmitted | **Owner-side** (tenant owner + role=owner) |
| Report submitted | report_submitted | Tenant managers |
| Task assigned | task_assigned | Tenant managers |

## MVP targeting logic

### Owner-side (`notifyOwnerSide`)

- **Recipients:** `tenants.user_id` (tenant owner) ∪ `tenant_members` with `role='owner'`
- **Used for:** `document_under_review`, `document_resubmitted` — events requiring owner/customer decision.
- **Fallback:** If no owner-side users, falls back to tenant managers.

### Manager-side (`notifyTenantManagers`)

- **Recipients:** `tenant_members` with `role` in (`owner`, `admin`, `member`)
- **Used for:** `issue_created`, `issue_status_changed`, `document_owner_decision`, `report_submitted`, `task_assigned`

## MVP limitations

- **No project-level owner:** No `project.owner_id` or `project.customer_id`; owner = tenant-level only.
- **No project-member targeting:** Issues/reports/tasks notify all tenant managers, not project-scoped members.
- **Viewer role excluded:** `tenant_members` with `role='viewer'` never receive notifications.
- **Next steps (out of scope):** Project-scoped recipients, customer/owner distinction at project level, preference center.

## Reminders

Deferred. Scheduled/cron-based reminders would require separate job infrastructure. Document as future step.

## Inbox open audit (2026-09-28)

Separate from read state. Opening a target records `audit_logs.action = notification_opened`. Mark-read does not.

`POST /api/v1/notifications/:id/opened` returns `{ "ok": true }` for an owned row and `404` otherwise. It does not update `read_at`. A failed or slow audit write still returns 200. One row per tenant, user, and notification id (`20260927230000_notification_opened_once.sql`). Details are categorical (`notification_type`, `target_type`, `source=inbox`); title and body are not stored.

Web, iOS Manager, and iOS Worker call this only when the inbox item has a real target route. Android does not call it. Push taps are not this event. Contract and client gates: `docs/growth/PRODUCT_ANALYTICS_PLAN.md`.
