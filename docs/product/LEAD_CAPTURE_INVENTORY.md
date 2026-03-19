# Lead Capture — Inventory

**Date:** 2026-03-19  
**Purpose:** Current state of contact/lead flow before lead-capture foundation phase.

---

## 1. Current contact flow

| Step | Where | What happens |
|------|--------|--------------|
| **Form** | `/[locale]/contact` (public) | `ContactForm.tsx`: name, email, company (optional), message. Client POST to `/api/contact`. |
| **API** | `POST /api/contact` | Zod validation (ContactSchema); `getAdminClient()` insert into `contact_leads`. Returns `{ ok: true }` or 400/500. |
| **Persistence** | `public.contact_leads` | Table exists (migration `20260307000000_contact_leads.sql`). Columns: id, name, email, company, message, created_at. RLS enabled, no policies — service role only. |

---

## 2. Current validation

- **ContactSchema (Zod):** name 1–200, email valid, company 0–200 optional, message 1–5000.
- **Server:** Same schema; 400 on validation failure with first error message.
- **Form:** required on name, email, message; maxLength 200/5000; company optional.

---

## 3. Current persistence state

- **Table:** `contact_leads` — inserts succeed when Supabase admin client is available.
- **No status, source, or notes** — table has only id, name, email, company, message, created_at.
- **Loss points:** (1) If `getAdminClient()` is null, API returns 500 and lead is not stored. (2) No retry or duplicate handling. (3) No manager visibility — no UI or API to read leads.

---

## 4. Biggest loss points

1. **No manager/admin visibility** — leads are stored but not viewable anywhere in the app.
2. **No status workflow** — cannot mark as reviewed, contacted, or archived.
3. **API 500 on missing admin client** — in some environments insert fails and user sees generic error.
4. **No source/status in DB** — cannot distinguish or filter by origin or state.

---

## 5. Chosen scope for this phase

- Add **status** (new, reviewed, contacted, archived) and **source** (e.g. contact_form), **notes** to schema and table.
- Keep **contact submit** persistence as-is; set default status/source on insert.
- Add **admin/manager retrieval**: list leads, get one, update status (and notes).
- Add **admin UI**: list view, detail view, status change; minimal, reusing existing admin patterns.
- **No** phone field (form does not collect it); **no** assignee in this phase; **no** CRM/sales automation.

---

## 6. Deferred scope

- Phone field (form does not support it yet).
- Assignee / ownership.
- Email notifications or outbound automation.
- Duplicate detection (e.g. same email within window).
- Public API or webhooks for leads.
- Tenant-scoped leads (contact form is platform-level; leads stay global for now).
