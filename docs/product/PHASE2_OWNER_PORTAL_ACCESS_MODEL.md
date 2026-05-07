# Phase 2 Owner / Customer Portal Access Model

Date: 2026-05-07

Roadmap phase: 2 - Owner / Customer Portal

## Naming Decision

This repository already reserves `/owner` and `/api/v1/owner/*` for the platform OWNER cabinet. That surface is protected by platform-owner middleware and must not be reused for customer/property-owner access.

Canonical customer-facing portal paths for this codebase:

- Customer portal UI: `/dashboard/projects/[id]/client`
- Customer portal API: `GET /api/v1/projects/:id/client-view`
- Customer action APIs: `client-requests`, client discussions, defects, service requests, and sanitized change orders under the existing project client routes.

This preserves the roadmap requirement to avoid conflict with platform owner/admin access.

## Roles

Current role model:

- Tenant internal roles: `owner`, `admin`, `member`, `viewer`
- Portal/customer role: `stakeholder`
- Project owner membership: `project_members.role = owner`
- External stakeholder records: `project_stakeholders`
- Platform owner: `platform_owner_grants`, separate from tenant/project owner

Canonical customer-facing roles:

- `stakeholder`: external customer portal user
- `project_members.role = owner`: legacy project owner access
- `client_decision_maker`: stakeholder role allowed to respond to customer requests

## Access Rules

Customer portal read access requires:

- authenticated user
- tenant membership
- `projects.client_portal_enabled = true`
- either project owner membership or active `project_stakeholders` row

Customer request response access requires:

- project owner membership, or
- active stakeholder with `stakeholder_role = client_decision_maker`

Portal-only stakeholders are redirected away from internal dashboard areas by `stakeholder-dashboard-paths`.

## Customer-Safe Data

Allowed:

- project name
- task progress totals
- customer-visible milestones
- customer-visible document metadata
- customer decisions based on visible documents
- explicit client requests
- customer-facing commercial/payment records with status `issued`, `due`, `overdue`, or `paid`
- sanitized change orders
- defects/punch list and aftercare surfaces already exposed through client routes
- handover status and notes

Forbidden:

- internal cost items
- actual company costs
- planned-vs-actual internal budget totals
- over-budget flags
- internal budget pressure
- margin/profitability
- subcontractor costs
- internal AI finance risk
- commercial item event actor history
- platform OWNER cabinet data

## Data Visibility Matrix

| Data | Manager | Worker | Customer |
|---|---|---|---|
| Project summary | yes | limited | yes |
| Worker internal IDs | yes | limited | no |
| Reports | yes | own | no direct report feed in Phase 2 |
| Media | yes | own/assigned | through approved/safe client surfaces only |
| Documents | yes | limited | only `client_visible` metadata |
| Internal costs | yes | no | no |
| Internal budget summary | yes | no | no |
| Commercial/payment records | yes | no | only issued/due/overdue/paid customer-facing rows |
| Change orders | yes | no | sanitized public list/detail |
| Decisions | yes | own/pending | assigned/customer-visible only |
| AI diagnostics | yes/admin | no | no |
| Audit logs | admin | no | no |
| Platform OWNER cabinet | platform owner only | no | no |

