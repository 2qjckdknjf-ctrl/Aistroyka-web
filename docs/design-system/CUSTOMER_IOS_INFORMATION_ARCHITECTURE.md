# Customer iOS information architecture

Customer mental model: **What is happening with my project?**

This is not a Manager clone. Contractor operations (task assignment, cost, crew, internal finance) stay out of the customer shell.

## Screens

| Screen | Purpose | Primary data |
| --- | --- | --- |
| Login | Authenticate a invited customer / stakeholder | `/api/v1/me` after PKCE |
| Home | Answer “which of my projects?” | `GET /api/v1/portal/projects` |
| Projects | Same as Home in this slice (list + empty/error) | portal list |
| Project detail | Status, progress, recent activity | `GET /api/v1/portal/projects/:id` |
| Intake | Draft, edit, and submit requested work | `GET/POST /api/v1/portal/intake`, `PATCH /api/v1/portal/intake/:id`, `POST .../submit`. See [CUSTOMER_INTAKE.md](../runbooks/CUSTOMER_INTAKE.md). |
| Evidence / progress | Shared documents and published progress | portal documents + progress |
| Decisions | Customer-visible decisions / requests | portal `decisions` |
| Notifications | Project events the customer is allowed to see | later |
| Profile / settings | Session, language, sign out | local + `/me` |

## Visual language

Reuse AISTROYKA dark canvas, gold accent, and glass density from Memory OS — but with lower operational density and no contractor control chrome.
