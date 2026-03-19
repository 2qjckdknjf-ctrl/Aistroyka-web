# Lead Capture — Domain Model

**Date:** 2026-03-19  
**Scope:** Minimal lead entity for contact-form persistence and manager visibility.

---

## 1. Entity: Lead (contact_leads)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| **id** | uuid | Yes | PK, default gen_random_uuid(). |
| **created_at** | timestamptz | Yes | Default now(). |
| **name** | text | Yes | Submitter name, 1–200 chars. |
| **email** | text | Yes | Valid email. |
| **company** | text | No | Optional, max 200. |
| **message** | text | Yes | Body, 1–5000 chars. |
| **source** | text | Yes | Origin: `contact_form` (default). |
| **status** | text | Yes | Workflow state, see below. |
| **notes** | text | No | Internal notes (admin/manager only). |

**No phone in this phase** — contact form does not collect it.  
**No assignee in this phase** — deferred.

---

## 2. Status lifecycle

| Status | Meaning |
|--------|--------|
| **new** | Just submitted; not yet reviewed. Default on insert. |
| **reviewed** | Manager has looked at it; no response yet. |
| **contacted** | Team has reached out. |
| **archived** | Closed without contact or no longer relevant. |

Transitions: any → any (admin/manager can set). No mandatory order; recommended: new → reviewed → contacted or archived.

---

## 3. Source

- **contact_form** — Public contact/demo form (POST /api/contact).  
Other sources (e.g. landing, import) can be added later; API and UI filter by source if needed.

---

## 4. Persistence rules

- **Insert:** Public API only; sets source, status default, no notes.
- **Read/Update:** Admin/manager only (requireAdmin); service role or admin-only API.
- **RLS:** contact_leads has RLS enabled, no select/insert/update policies for roles — only service role (bypass) can access. Admin API uses getAdminClient() for list/get/patch.

---

## 5. Remaining gaps (acceptable for phase)

- No assignee; no round-robin or ownership.
- No duplicate detection (same email within time window).
- No audit log for status changes (can add later).
- Phone not collected or stored.
