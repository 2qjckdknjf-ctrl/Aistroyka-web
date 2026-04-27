# Wave 4 Step 8 — Strict post-audit (Stage J)

## Classification

| Item | Status | Notes |
|------|--------|-------|
| 1. Notification scope selection | **FULL** | Finite event set; no messaging/campaign scope creep. |
| 2. Notification model | **FULL** | Table + kinds + linkage columns + statuses implemented. |
| 3. Trigger wiring | **FULL** | Invite create/resend, request create, respond→manager, accept→manager, cron reminders. |
| 4. Delivery path reality | **PARTIAL** | In-app + email are implemented; email is **real** only when Resend (or compatible) env is configured — otherwise rows + `email_failed` are still real. |
| 5. Manager visibility/control | **FULL** | Delivery log + resend invite + existing manager inbox for respond/accept. |
| 6. Stakeholder-facing UX | **FULL** | Portal notifications section + mark read (for users with rows). |
| 7. Integration strength | **FULL** | Wired to listed APIs and cron; no orphan UI. |
| 8. Validation strength | **PARTIAL** | Focused unit tests + production build; no full E2E for email delivery in CI. |

## Remaining issues

| Priority | Item |
|----------|------|
| **P1** | Apply `20260329170000_stakeholder_notifications.sql` in staging/production before relying on features. |
| **P1** | Configure outbound email env for production stakeholder emails (otherwise audit rows exist but email is not delivered). |
| **P2** | Broader API route tests (integration with mocked Supabase) for new endpoints. |
| **P2** | Per-tenant notification preferences (deferred by design). |

## Wave 4 Step 8 closure gate

Hard rules from spec:

- **Not decorative:** Triggers are event-driven from API + cron — **satisfied**.
- **Real delivery path:** In-app list + mark read is always real; email is conditional on env — **partial** on email alone; **PASS** for “at least one real path” (in-app).
- **Manager delivery visibility:** Delivery log + inbox — **satisfied**.
- **Validation:** Build green + targeted tests — **acceptable**; not “skipped.”

**Step closed enough for next sub-step: YES** — with the explicit **P1** dependency on migration apply and production email configuration for full email value.
