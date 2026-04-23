# Wave 4 Step 9 — Stakeholder activity / timeline inventory

## Event kinds (read model)

| Kind | Source | Stakeholder sees | Manager sees |
|------|--------|------------------|--------------|
| `client_request_*` | `project_client_request_events` | Created, responded, completed, cancelled; **not** `updated` | All including `updated` |
| `stakeholder_invite_sent` | `project_stakeholders` row | No | Yes (internal) |
| `stakeholder_joined_portal` | `accepted_at` / self | Yes — **only “You joined”** for self | Yes — per-email join lines (internal) |

## Why this set

- Aligns with **client requests** and **stakeholder lifecycle** already in the product.
- Avoids mixing **team operations** (reports, uploads, tasks) into the stakeholder transparency layer — those stay on `GET /timeline` (“Project operations”).

## Deferred scope

- Comments, chat, threaded discussions.
- Notifications / delivery logs (Wave 4 Step 8 — separate product surface).
- Real-time websockets; full-text search on timeline.
- Document/milestone/budget-specific events in this read model (could be a later step).
