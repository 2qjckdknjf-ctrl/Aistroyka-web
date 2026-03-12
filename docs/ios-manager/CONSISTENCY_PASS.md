# Consistency Pass (Phase 5)

**Date:** 2026-03-07  
**Scope:** Terminology, status, labels, dates, errors, role.

---

## Terminology

- **Task** (not "assignment" for the entity); **Assign** for the action. **Report** (field report); **Review** for manager actions. **Project**; **Worker** (team member). **Notifications** (inbox); **Devices** (registered for push).
- **Manager** app vs **Worker** app; no mixed "admin" in UI except Settings if present.

## Status names

- **Task:** pending, in_progress, done (display: capitalized, e.g. "In progress").
- **Report:** draft, submitted, approved, reviewed, changes_requested (display: capitalized, underscores as spaces).
- **AI job:** queued, running, success, failed (from backend).

## Button labels

- "Assign to worker" (task detail). "Approve", "Mark reviewed", "Request changes" (report detail). "Sign out" (More). "Cancel" / "Create" in sheets. "Create" for new task. Consistent verb form.

## Date/time formats

- Abbreviated date + shortened time where time matters (e.g. report submitted_at); abbreviated date only for list rows and "Last report" subtitle. ISO8601DateFormatter with fractional seconds fallback to prefix(19)+"Z".

## Error messages

- API message (APIError.message) or error.localizedDescription; not generic when backend returns a message. Auth/tenant errors surface as received.

## Role language

- GET /api/v1/me returns role; Manager app targets owner/admin/member. No "foreman" in UI unless backend exposes it. Unauthorized: ManagerUnauthorizedView.
