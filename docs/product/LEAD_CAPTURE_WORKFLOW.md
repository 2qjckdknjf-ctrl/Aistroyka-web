# Lead Capture — Workflow

**Date:** 2026-03-19  
**Scope:** How leads move from submission to visibility and status.

---

## 1. Intake

- **Public:** User submits contact form at `/[locale]/contact`. POST `/api/contact` validates (name, email, company optional, message) and inserts into `contact_leads` with `source: contact_form`, `status: new`.
- **No email/notification** in this phase; lead is stored only.

---

## 2. Visibility

- **Admin/manager:** Logged-in user with admin role (tenant-scoped) opens **Admin → Contact leads** (`/admin/leads`). List is loaded from GET `/api/v1/admin/leads` (optional `?status=new` etc.).
- **New leads** are clearly visible: default list is by `created_at` desc; status filter "New" shows only `status=new`. Badge: new = danger (attention), reviewed = warning, contacted = success, archived = neutral.

---

## 3. Status flow

| Status    | Meaning |
|----------|---------|
| **new**  | Just submitted; needs review. |
| **reviewed** | Seen; no response yet. |
| **contacted** | Team has reached out. |
| **archived** | Closed or not relevant. |

- **Transitions:** Any status can be set from the lead detail page (`/admin/leads/[id]`). No mandatory order; recommended: new → reviewed → contacted or archived.
- **Archived/reviewed** do not appear as "new" in the list because status is shown and filterable.

---

## 4. Actionability

- **What requires attention:** Leads with status **new** (and optionally **reviewed**). Use filter "New" on the leads list.
- **Detail page:** Open a lead → see full message, set status, add internal notes, Save. Notes are for internal use only.
- **No** round-robin, assignee, or SLA in this phase.

---

## 5. Integration with existing surfaces

- **Admin home:** Link "Contact leads →" on main admin page points to `/admin/leads`.
- **No** change to dashboard priority actions or alerts in this phase; can be added later (e.g. "N new leads") if desired.
