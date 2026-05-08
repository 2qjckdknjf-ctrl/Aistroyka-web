# AISTROYKA — UPDATED MEGA ROADMAP FOR CURSOR
Version: 2026-05-06
Status: UPDATED WITH CUSTOMER FINANCE ISOLATION RULE
Purpose: Deep sequential product/engineering plan to finish AISTROYKA as a production-ready AI construction management platform.

---

# 0. CORE PRODUCT POSITIONING

AISTROYKA must become:

> AI-powered construction trust and control platform:
> evidence + schedule + documents + approvals + customer decisions + estimates/change approvals + AI daily control.

The project must not become a generic project-management clone.
Its strongest market position is construction-specific operational truth.

## Main user groups

1. Construction company owner / director
2. Project manager / foreman
3. Worker / subcontractor
4. Customer / property owner
5. Platform operator / admin

## Main business promise

AISTROYKA helps construction companies prove work, control risks, avoid disputes, manage documents, manage customer approvals, and keep customers informed without exposing internal company finances.

---

# 1. CRITICAL PRODUCT RULE — CUSTOMER FINANCE ISOLATION

This rule is mandatory across the whole project.

## 1.1 Customer must NOT see internal financial state

The customer / property owner must never see:

- internal project margin
- internal budget pressure
- company profitability
- internal planned vs actual costs
- contractor labor cost
- subcontractor purchase prices
- internal cost overruns
- internal cost item list
- internal estimates vs real expense delta
- internal financial health score
- company cashflow
- internal AI finance risk
- manager-only cost analytics

## 1.2 Customer CAN see only commercial-facing financial documents/requests

The customer can see:

- estimate sent for approval
- additional estimate / допсмета
- change order price that requires approval
- payment schedule if intentionally customer-facing
- invoice / act / contract if intentionally shared
- approved amount for a specific customer decision
- rejected / pending estimate decisions
- history of customer-approved commercial changes

## 1.3 Correct language

Use different product language for internal and customer-facing finance.

### Internal manager language

Use:

- cost control
- budget pressure
- actual cost
- planned cost
- overrun
- margin risk
- cost item
- internal budget
- profitability
- financial risk

### Customer-facing language

Use:

- estimate
- proposal
- additional work
- approval required
- approved amount
- rejected proposal
- pending estimate
- payment schedule
- commercial document
- agreed price

## 1.4 Architecture rule

Internal tables/services can store detailed cost data.
Customer APIs must expose only explicit customer-facing projections.

Preferred separation:

- `project_cost_items` — internal only
- `estimates` / `customer_estimates` — customer-facing
- `change_orders` — customer-facing if sent for approval
- `decision_requests` — customer-facing approval wrapper
- `documents` — customer-facing only when visibility flag permits

## 1.5 API rule

Never reuse manager cost routes for owner/customer.

Forbidden for owner/customer:

```text
GET /api/v1/projects/:id/costs
GET /api/v1/projects/:id/costs/*
GET /api/v1/projects/:id/internal-budget
GET /api/v1/projects/:id/cost-summary
```

Allowed owner/customer equivalents:

```text
GET /api/v1/owner/projects/:id/estimates
GET /api/v1/owner/projects/:id/change-orders
GET /api/v1/owner/projects/:id/decisions
GET /api/v1/owner/projects/:id/commercial-documents
```

## 1.6 UI rule

Owner Portal must not contain:

- Costs tab
- Budget tab
- Internal finance tab
- Margin/risk/cost-overrun cards
- Internal cost analytics

Owner Portal may contain:

- Estimates to approve
- Additional work proposals
- Approved commercial changes
- Payment milestones if explicitly configured
- Documents shared with customer

---

# 2. NON-NEGOTIABLE EXECUTION RULES FOR CURSOR

## 2.1 Work sequentially

Do not skip stages.
Do not open a new product layer while the current one has meaningful unfinished work.

## 2.2 Every stage must end with verification

For each stage produce:

- implementation summary
- tests/build results
- changed files list
- risk list
- open issues
- final YES/NO closure verdict

## 2.3 No fake completeness

Never mark a step closed if:

- code is implemented but not wired into UI
- UI exists but API is fake
- API exists but DB migration is unapplied
- local tests pass but live/runtime is unverified where required
- access control is not tested
- tenant/project boundaries are not verified
- customer finance isolation is not tested

## 2.4 Mandatory validation

At minimum after every major stage:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

If specific route/domain tests exist, run them too.

## 2.5 Security rules

- Never commit secrets.
- Never print raw secrets.
- Preserve tenant isolation.
- Preserve role boundaries.
- Owner/customer views must not leak internal admin/operator data.
- Owner/customer views must not leak internal financial state.
- Share links must be scoped and tokenized.

---

# 3. CURRENT BASELINE FROM REPO

AISTROYKA is already a substantial monorepo:

- `apps/web` — main Next.js / OpenNext / Cloudflare Workers app
- `packages/contracts` — shared Zod contracts
- `ios/` and `android/` — mobile surfaces
- versioned public API under `/api/v1/*`
- Cloudflare staging/production deploy workflows
- pilot smoke workflows
- Supabase migrations and RLS foundations

The current product already includes core project tabs for:

- workers
- contractors
- reports
- uploads
- AI
- intelligence
- schedule
- documents
- costs
- estimate

This roadmap assumes these foundations exist and must be hardened, connected, and productized.

---

# 4. MASTER SEQUENCE

| Order | Phase | Goal |
|---:|---|---|
| 0 | Live Truth Verification | Prove repo, production, staging and Supabase are aligned |
| 1 | Manager Daily Control Center | One screen showing what needs action today |
| 2 | Owner / Customer Portal | Customer-facing transparency without internal finance leakage |
| 3 | Decision Requests | Formalize customer decisions |
| 4 | Customer Estimates / Commercial Approvals | Send estimates and additional work proposals for approval |
| 5 | Change Orders | Manage approved scope, commercial deltas and schedule impact |
| 6 | Proof Pack | Viral before/after evidence reports |
| 7 | AI Daily Digest | Daily automatic project control summary |
| 8 | Punch List / Defects | Defects and final acceptance loop |
| 9 | Handover Pack | Final project closeout package |
| 10 | Telegram Bot Layer | Fast notifications and quick actions |
| 11 | Contractor Directory | Internal contractor quality/rating foundation |
| 12 | Monetization / Packaging | Make it sellable |
| 13 | Production Hardening Final | Security, observability, E2E, release gate closure |

---

# PHASE 0 — LIVE TRUTH VERIFICATION

## Goal

Prove that production, staging, GitHub main and live Supabase are aligned.

## Tasks

### 0.1 Production SHA verification

Check:

- `https://aistroyka.ai/api/v1/health`
- buildStamp sha
- build time
- env

### 0.2 Staging verification

Check:

- `https://staging.aistroyka.ai/api/v1/health`
- staging buildStamp
- staging smoke status
- staging deploy workflow result

### 0.3 Supabase live schema verification

Verify required live tables:

- tenants
- tenant_members
- projects
- project_members
- worker_tasks
- worker_reports
- media
- upload_sessions
- project_documents
- project_cost_items
- project_milestones
- audit_logs
- alerts

### 0.4 Customer finance isolation pre-audit

Before owner/customer work, inspect whether any existing owner/customer/stakeholder routes expose:

- costs
- budget summary
- cost items
- cost risks
- internal financial signals
- AI finance recommendations

Create a report.

## Deliverables

```text
docs/audit/LIVE_PRODUCTION_TRUTH_REPORT.md
docs/audit/LIVE_SUPABASE_SCHEMA_REPORT.md
docs/audit/LIVE_SMOKE_REPORT.md
docs/security/CUSTOMER_FINANCE_ISOLATION_PREAUDIT.md
```

## Done criteria

- production SHA known
- staging SHA known
- live Supabase table presence verified
- migration dry-run status known
- production smoke result known
- customer finance leak pre-audit completed

---

# PHASE 1 — MANAGER DAILY CONTROL CENTER

## Goal

Turn manager dashboard into a daily control center.

The manager must answer immediately:

> What is burning today and what should I do first?

## Product concept

Create one unified action surface that aggregates:

- overdue work
- missing evidence
- approval queue
- pending documents
- internal cost overruns
- milestone risks
- stale reports
- upload failures
- customer decisions
- customer estimate approvals
- AI risks

## Tasks

### 1.1 Action item inventory

Inspect all existing signal sources:

- project intelligence
- schedule/milestones
- documents
- costs
- approvals
- reports
- uploads
- alerts
- decision requests
- customer estimates
- AI diagnostics

### 1.2 Unified ManagerActionItem model

Add or formalize:

```ts
type ManagerActionItem = {
  id: string
  type:
    | "missing_evidence"
    | "overdue_task"
    | "milestone_at_risk"
    | "approval_pending"
    | "document_review"
    | "internal_cost_overrun"
    | "customer_estimate_pending"
    | "customer_decision_pending"
    | "upload_problem"
    | "ai_risk"
    | "system_alert"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  reason: string
  project_id: string
  project_name?: string
  linked_entity_type?: string
  linked_entity_id?: string
  href: string
  recommended_action: string
  visibility: "internal_manager_only"
  created_at?: string
}
```

### 1.3 Server-side aggregation

Create service:

```text
apps/web/lib/domain/dashboard/manager-actions.service.ts
```

It must:

- collect real data
- avoid fake recommendations
- sort by severity and urgency
- return max 10–20 items
- include drill-down hrefs
- mark internal finance actions as manager-only

### 1.4 API route

Add:

```text
GET /api/v1/dashboard/manager-actions
```

### 1.5 Dashboard UI

Add block:

```text
"What needs attention today"
```

## Customer finance isolation rule

Manager Daily Control Center may show internal finance.
Owner Portal must not consume this route.

## Deliverables

```text
docs/product/PHASE1_MANAGER_DAILY_CONTROL_CENTER.md
docs/product/PHASE1_MANAGER_ACTION_ITEM_STANDARD.md
```

## Done criteria

- manager sees actionable prioritized list
- internal finance actions are manager-only
- route is protected
- no owner/customer access to manager action feed
- tests pass

---

# PHASE 2 — OWNER / CUSTOMER PORTAL

## Goal

Create a customer-facing portal that gives transparent project progress without exposing internal company operations or finances.

## Product promise

Construction company can tell customer:

> You will see your project progress, photos, shared documents, questions requiring your decision, and estimates sent to you for approval.

## Customer must NOT see

- internal project budget
- actual company costs
- cost overruns
- margin
- profitability
- subcontractor costs
- internal cost item list
- manager financial risk
- AI internal finance analysis
- internal company financial health

## Customer CAN see

- estimates sent for approval
- допсметы / additional work proposals
- approved commercial changes
- payment schedule if explicitly configured
- documents intentionally shared
- project progress
- proof photos
- pending questions/decisions

## Tasks

### 2.1 Access model audit

Inspect current roles:

- tenant roles
- project roles
- owner role
- stakeholder role if present
- platform owner/admin

Decide canonical customer-facing roles:

- `client`
- `owner`
- `stakeholder`

Avoid conflict with platform owner cabinet.

### 2.2 Data visibility matrix

Create matrix:

| Data | Manager | Worker | Customer |
|---|---|---|---|
| project summary | yes | limited | yes |
| worker internal IDs | yes | limited | no/limited |
| reports | yes | own | selected/safe |
| media | yes | own | approved/shared |
| documents | yes | no/limited | only shared |
| internal costs | yes | no | no |
| internal budget summary | yes | no | no |
| estimates sent to customer | yes | no | yes |
| approved change order amount | yes | no | yes |
| decisions | yes | own/pending | assigned |
| AI diagnostics | yes/admin | no | no |
| audit logs | admin | no | no |

### 2.3 Owner routes

Create:

```text
/owner
/owner/projects
/owner/projects/[id]
/owner/projects/[id]/progress
/owner/projects/[id]/documents
/owner/projects/[id]/decisions
/owner/projects/[id]/estimates
/owner/projects/[id]/proof
```

No `/owner/projects/[id]/costs`.

### 2.4 Owner APIs

Add safe customer APIs:

```text
GET /api/v1/owner/projects
GET /api/v1/owner/projects/:id
GET /api/v1/owner/projects/:id/progress
GET /api/v1/owner/projects/:id/documents
GET /api/v1/owner/projects/:id/decisions
GET /api/v1/owner/projects/:id/estimates
GET /api/v1/owner/projects/:id/proof
```

### 2.5 Owner dashboard UI

Show:

- project status
- progress summary
- latest approved photos
- upcoming milestones
- pending customer decisions
- documents requiring review
- estimates pending approval
- approved commercial changes
- safe risk summary without internal finance

Do not show:

- costs tab
- budget tab
- cost overrun cards
- internal finance analytics
- manager action feed

### 2.6 Security tests

Test:

- owner cannot open another tenant project
- owner cannot open internal manager routes
- owner cannot access `/api/v1/system/*`
- owner cannot access manager costs routes
- owner cannot see internal AI logs
- owner cannot see unrelated documents
- owner cannot query project cost items

## Deliverables

```text
docs/product/PHASE2_OWNER_PORTAL_ACCESS_MODEL.md
docs/product/PHASE2_OWNER_PORTAL_COMPLETION_REPORT.md
docs/security/PHASE2_OWNER_PORTAL_SECURITY_AUDIT.md
docs/security/PHASE2_CUSTOMER_FINANCE_ISOLATION_REPORT.md
```

## Done criteria

- customer portal works
- access isolation tested
- no internal financial leakage
- customer can see progress, documents, decisions and estimates
- manager can link customer to project

---

# PHASE 3 — DECISION REQUESTS

## Goal

Move customer decisions out of WhatsApp and phone calls into structured product workflow.

## Core use cases

- approve material
- choose design
- approve extra work
- accept schedule shift
- approve document
- accept completed work
- answer question
- approve estimate

## Tasks

### 3.1 Domain model

Add table:

```sql
decision_requests
```

Fields:

```text
id
tenant_id
project_id
type
title
description
status
priority
requested_by
assigned_to
due_at
decided_at
decision_note
linked_entity_type
linked_entity_id
customer_visible_amount
customer_visible_currency
created_at
updated_at
```

Types:

```text
design_choice
material_choice
estimate_approval
cost_change_customer_facing
schedule_change
document_approval
work_acceptance
general_question
other
```

Statuses:

```text
pending
approved
rejected
answered
cancelled
expired
```

### 3.2 Customer-visible amount rule

Decision requests may expose a customer-facing amount only if it is explicitly intended for customer approval.

Do not expose:

- internal actual cost
- margin
- internal overrun
- subcontractor cost
- internal cost item details

### 3.3 API routes

Manager:

```text
POST /api/v1/projects/:id/decision-requests
GET /api/v1/projects/:id/decision-requests
PATCH /api/v1/projects/:id/decision-requests/:requestId
```

Owner:

```text
GET /api/v1/owner/projects/:id/decisions
POST /api/v1/owner/projects/:id/decisions/:requestId/respond
```

### 3.4 Manager UI

Add to project detail:

- Decisions tab or panel
- Create decision request
- link to document/task/estimate/milestone
- status list
- overdue decision highlight

### 3.5 Owner UI

In Owner Portal:

- pending decisions
- approve/reject/answer
- comments
- attached photos/documents
- estimate/change amount only when customer-facing

### 3.6 Audit trail

Log every decision state change.

### 3.7 Integration with Manager Daily Control Center

Pending/overdue decisions must appear as manager actions.

## Deliverables

```text
docs/product/PHASE3_DECISION_REQUESTS_DOMAIN.md
docs/product/PHASE3_DECISION_REQUESTS_UI_REPORT.md
docs/product/PHASE3_DECISION_REQUESTS_SECURITY_AUDIT.md
```

## Done criteria

- manager can create decision request
- customer can respond
- status updates
- audit trail exists
- no internal finance fields exposed to owner/customer
- manager dashboard sees pending/overdue decisions

---

# PHASE 4 — CUSTOMER ESTIMATES / COMMERCIAL APPROVALS

## Goal

Create a customer-facing estimate approval layer.

This is separate from internal cost control.

## Why

Customer should approve:

- initial estimate
- additional estimate
- commercial proposal
- payment milestone
- scope change price

Customer should not see internal costs.

## Tasks

### 4.1 Domain model

Add:

```sql
customer_estimates
```

Fields:

```text
id
tenant_id
project_id
title
description
status
total_amount
currency
valid_until
created_by
sent_to_customer_at
approved_by_customer_at
rejected_by_customer_at
customer_note
linked_document_id
linked_decision_request_id
created_at
updated_at
```

Statuses:

```text
draft
sent
approved
rejected
expired
cancelled
superseded
```

### 4.2 Estimate line items

Optional but recommended:

```sql
customer_estimate_items
```

Fields:

```text
id
estimate_id
title
description
quantity
unit
unit_price
total_price
sort_order
```

Important:
These are commercial line items, not internal cost items.

### 4.3 API

Manager:

```text
POST /api/v1/projects/:id/estimates
GET /api/v1/projects/:id/estimates
PATCH /api/v1/projects/:id/estimates/:estimateId
POST /api/v1/projects/:id/estimates/:estimateId/send
```

Owner:

```text
GET /api/v1/owner/projects/:id/estimates
GET /api/v1/owner/projects/:id/estimates/:estimateId
POST /api/v1/owner/projects/:id/estimates/:estimateId/respond
```

### 4.4 Integration with decision requests

When an estimate is sent to customer:

- create linked decision request of type `estimate_approval`
- owner approves/rejects
- estimate status updates

### 4.5 Manager UI

Project tab:

```text
Estimates
```

Features:

- create estimate
- add commercial line items
- attach document/PDF
- send for approval
- see customer response

### 4.6 Owner UI

Owner Portal:

```text
Estimates to approve
```

Shows:

- title
- description
- total customer-facing amount
- line items if intended
- document attachment
- approve/reject
- comment

### 4.7 Isolation from internal costs

Do not use `project_cost_items` as owner response payload.
If internal costs need to generate estimate draft, create explicit sanitized estimate copy.

## Deliverables

```text
docs/product/PHASE4_CUSTOMER_ESTIMATES_DOMAIN.md
docs/product/PHASE4_CUSTOMER_ESTIMATES_UI_REPORT.md
docs/security/PHASE4_ESTIMATE_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- manager creates estimate
- manager sends estimate to owner
- owner approves/rejects
- approved estimate visible as customer-approved commercial item
- no internal cost/margin leak
- tests cover finance isolation

---

# PHASE 5 — CHANGE ORDERS / ДОПРАБОТЫ

## Goal

Create controlled extra work process.

## Why

This is a core construction business process.
Many disputes come from unstructured extras.

## Important finance rule

Change order may show the customer-approved commercial price.
It must not show internal implementation cost, margin, profit, or budget pressure.

## Tasks

### 5.1 Domain model

Add:

```sql
change_orders
```

Fields:

```text
id
tenant_id
project_id
title
description
reason
customer_amount_delta
currency
schedule_delta_days
status
linked_task_id
linked_document_id
linked_customer_estimate_id
linked_decision_request_id
internal_cost_item_id
created_by
approved_by_customer
approved_at
created_at
updated_at
```

Do not expose `internal_cost_item_id` to customer APIs.

Statuses:

```text
draft
sent_to_owner
approved
rejected
implemented
cancelled
```

### 5.2 API

Manager:

```text
POST /api/v1/projects/:id/change-orders
GET /api/v1/projects/:id/change-orders
PATCH /api/v1/projects/:id/change-orders/:changeOrderId
POST /api/v1/projects/:id/change-orders/:changeOrderId/send
```

Owner:

```text
GET /api/v1/owner/projects/:id/change-orders
POST /api/v1/owner/projects/:id/change-orders/:changeOrderId/respond
```

### 5.3 Cost integration

If approved:

- optionally create internal cost item
- update internal budget summary for managers only
- customer sees only approved commercial change amount

### 5.4 Schedule integration

If approved and `schedule_delta_days > 0`:

- mark milestone schedule pressure
- show in manager schedule
- show owner-friendly schedule impact

### 5.5 Documents integration

Generate optional act/document placeholder after approval.

## Deliverables

```text
docs/product/PHASE5_CHANGE_ORDERS_DOMAIN.md
docs/product/PHASE5_CHANGE_ORDERS_INTEGRATION_REPORT.md
docs/security/PHASE5_CHANGE_ORDER_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- manager creates change order
- owner approves/rejects customer-facing price
- approved change affects internal costs only for manager
- owner cannot see internal costs
- schedule impact visible in safe form
- audit trail exists

---

# PHASE 6 — PROOF PACK / BEFORE-AFTER EVIDENCE

## Goal

Create the most viral product feature:
shareable proof of completed construction work.

## Customer finance rule

Proof Pack must not expose internal financial state.
It may show approved commercial estimate/change reference only if intentionally included.

## Tasks

### 6.1 Evidence classification

Ensure media supports:

- before
- after
- progress
- issue
- document
- other

### 6.2 Task Proof Pack

For each task:

- task title
- before photos
- after photos
- assigned worker display name if allowed
- report link
- submitted at
- approved/rejected status
- manager note approved for customer visibility
- AI evidence quality/evidence completeness score

### 6.3 Project Proof Pack

Project-level summary:

- completed tasks
- accepted reports
- photos grouped by milestone/task
- customer-visible documents
- decisions
- approved customer-facing change orders
- punch items once Phase 8 exists

### 6.4 Share link

Create tokenized share route:

```text
/share/proof/:token
```

Rules:

- scoped to one project/proof pack
- expiration optional
- revocable
- no internal admin data
- no internal finance data
- no raw tenant leakage

## Deliverables

```text
docs/product/PHASE6_PROOF_PACK_DOMAIN.md
docs/product/PHASE6_SHARE_LINK_SECURITY.md
docs/product/PHASE6_PROOF_PACK_REPORT.md
```

## Done criteria

- manager can create/open proof pack
- customer can view proof pack
- share link safe
- no internal leakage
- no internal finance leakage
- proof pack is visually strong and mobile-friendly

---

# PHASE 7 — AI DAILY DIGEST

## Goal

Generate daily automatic construction control summary.

## Digest types

### Manager digest

May include internal signals:

- completed work
- missing evidence
- overdue tasks
- milestone risks
- document review needs
- internal cost overruns
- pending customer decisions
- estimates awaiting customer approval
- top 3 risks
- recommended actions

### Owner digest

Must exclude internal financial state.

Can include:

- progress summary
- approved work
- photos
- pending decisions
- estimate approval requests
- approved commercial changes
- customer-visible documents
- safe schedule impact

Must not include:

- internal cost overrun
- internal budget pressure
- margin
- profitability
- internal AI finance risk
- subcontractor costs

## Tasks

### 7.1 Digest generation service

Create:

```text
apps/web/lib/domain/digest/daily-digest.service.ts
```

### 7.2 Audience separation

Digest service must require:

```ts
audience: "manager" | "owner"
```

The service must use different data projection per audience.

### 7.3 Digest records

Optional table:

```sql
project_daily_digests
```

Fields:

```text
id
tenant_id
project_id
audience
summary_json
created_at
created_by_system
```

### 7.4 Dashboard UI

Manager:

- daily digest card
- regenerate if allowed
- open details

Owner:

- daily summary on portal

## Deliverables

```text
docs/ai/PHASE7_DAILY_DIGEST_STANDARD.md
docs/ai/PHASE7_DAILY_DIGEST_REPORT.md
docs/security/PHASE7_DIGEST_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- digest generated from real data
- manager and owner versions separated
- owner digest excludes internal finance
- tests cover empty/partial/risky project states
- tests cover customer finance isolation

---

# PHASE 8 — PUNCH LIST / DEFECTS

## Goal

Support final defect tracking and acceptance.

## Implementation note (repo)

Punch list / defects are modeled as **`public.project_defects`** (migration `20260404120000_project_defects.sql`), not a separate `punch_items` table. Status vocabulary differs slightly from the sketch below (`ready_for_verification`, `resolved`, `closed` vs `ready_for_review`, `accepted`, etc.). Follow-up migrations may add roadmap fields — e.g. optional severity and before/after photo links to **`worker_report_media`** (`20260507193000_project_defects_severity_and_photos.sql`).

## Tasks

### 8.1 Domain model

Roadmap shorthand `punch_items` maps to **`public.project_defects`**. Comparable fields:

```text
id
tenant_id
project_id
title
description
status
severity
assigned_to
due_date (date column)
photo_before_report_media_id  (references worker_report_media; roadmap “before” evidence)
photo_after_report_media_id  (references worker_report_media; roadmap “after” evidence)
accepted_by
accepted_at
created_at
updated_at
```

Statuses:

```text
open
in_progress
ready_for_review
accepted
rejected
cancelled
```

### 8.2 Manager UI

Project tab:

```text
Defects / Punch list
```

### 8.3 Worker flow

Worker sees assigned punch item.
Can upload after photo.
Can mark ready for review.

### 8.4 Owner visibility

Owner can see customer-visible punch list:

- open defects
- fixed defects
- accepted items
- no internal financial data

## Deliverables

```text
docs/product/PHASE8_PUNCH_LIST_DOMAIN.md
docs/product/PHASE8_PUNCH_LIST_REPORT.md
```

## Done criteria

- defects can be created, assigned, fixed, reviewed
- photos supported
- overdue/critical defects appear in manager actions
- owner-safe view exists

---

# PHASE 9 — HANDOVER PACK

## Implementation note (repo, Phase 9 v1)

- Readiness blockers: `computeHandoverReadiness` / `computeHandoverReadinessFromSummary` (`handover-readiness.ts`).
- **Customer handover pack** (preview + print): `GET /api/v1/projects/:id/handover/pack`, domain `handover-pack.service.ts`, UI `/dashboard/projects/:id/handover/pack`. Browser print is the initial export surface; PDF optional later.

## Goal

Create final project closeout package.

## Handover content

Customer-visible:

- project summary
- completed milestones
- accepted reports
- proof packs
- customer-visible documents/acts/contracts
- approved change orders
- approved estimates
- closed punch list
- customer decisions history
- warranty/guarantee notes if present

Manager-internal only:

- internal cost summary
- profitability
- internal budget state
- internal risk notes
- contractor cost analytics

## Tasks

### 9.1 Handover readiness service

Create service that returns:

```ts
{
  ready: boolean
  blockers: HandoverBlocker[]
  sections: HandoverSection[]
}
```

Blockers:

- open punch items
- unsigned customer-visible documents
- pending approvals
- unresolved decisions
- missing final proof
- pending estimate/change approvals

Do not include internal budget not finalized as a customer-visible blocker.
Manager may see internal finance readiness separately.

### 9.2 Manager UI

Button:

```text
Prepare handover
```

Show:

- readiness score
- blockers
- preview
- share/export

### 9.3 Owner UI

Owner can view customer handover pack.

### 9.4 Export

Start with print-friendly HTML.
Add PDF later if stable.

## Deliverables

```text
docs/product/PHASE9_HANDOVER_PACK_REPORT.md
docs/product/PHASE9_HANDOVER_READINESS_STANDARD.md
docs/security/PHASE9_HANDOVER_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- handover readiness works
- blockers are clear
- handover pack generated
- owner can view
- no internal data leak
- no internal finance leak

---

# PHASE 10 — TELEGRAM BOT LAYER

## Goal

Use Telegram as a communication and quick-action layer, not as the only auth system.

## Bot use cases

### Worker

- receive task
- upload photo
- submit quick report
- receive reminder

### Owner

- receive decision request
- approve/reject
- open proof pack
- receive customer-safe digest
- approve estimate/change order

### Manager

- receive top risks
- receive overdue alert
- open dashboard

## Security / finance rule

Telegram owner messages must not include internal finance.
They can include:

- estimate approval request
- approved commercial amount
- link to customer portal

## Deliverables

```text
docs/integrations/PHASE10_TELEGRAM_BOT_DESIGN.md
docs/integrations/PHASE10_TELEGRAM_SECURITY_MODEL.md
docs/product/PHASE10_TELEGRAM_REPORT.md
```

## Done criteria

- linking works
- at least one manager notification works
- at least one owner decision notification works
- audit trail exists
- no Telegram-only auth dependency for core platform
- no internal finance leak in owner Telegram messages

---

# PHASE 11 — CONTRACTOR DIRECTORY

## Goal

Create internal contractor quality directory before any public marketplace.

## Important customer visibility rule

Contractor performance metrics are internal.
Customer should not see:

- contractor rating
- rejection rate
- delay analytics
- internal notes
- cost rates

## Tasks

### 11.1 Contractor profile

Fields:

```text
id
tenant_id
user_id
company_name
specializations
phone
email
status
notes
```

### 11.2 Performance metrics

Calculate:

- tasks completed
- reports submitted
- missing evidence rate
- rejection rate
- average delay
- active projects
- quality score

### 11.3 Manager UI

Directory:

- list contractors
- filter by specialization
- open profile
- see performance

## Deliverables

```text
docs/product/PHASE11_CONTRACTOR_DIRECTORY_REPORT.md
```

(Implementation: `tenant_contractor_profiles`, `/api/v1/contractors/directory`, dashboard `/dashboard/contractors`.)

## Done criteria

- contractor profile exists
- metrics generated
- manager can select/filter contractors
- no public marketplace scope creep
- no contractor internal metrics shown to customer

---

# PHASE 12 — MONETIZATION / PACKAGING

## Goal

Make product sellable.

## Plans

### Starter

For small teams:

- 1–3 projects
- limited users
- reports/photos
- basic proof pack
- owner portal
- estimate approvals

### Pro

For growing companies:

- documents
- internal costs
- decision requests
- customer estimates
- change orders
- AI daily digest

### Business

For serious contractors:

- advanced permissions
- custom branding
- Telegram integration
- handover pack
- contractor analytics

### Enterprise

- SSO later
- advanced audit
- custom retention
- dedicated support
- integrations

## Important pricing rule

Do not imply customer gets access to company internal finance.
Phrase customer-side value as:

- estimate approval
- transparent progress
- proof of completed work
- decisions in one place
- shared documents

## Deliverables

```text
docs/business/PHASE12_PACKAGING_AND_PRICING.md
docs/product/PHASE12_PLAN_LIMITS_IMPLEMENTATION.md
docs/product/PHASE12_ROADMAP_CLOSURE.md
```

## Done criteria

- features mapped to plans
- limits enforceable
- pricing page matches product reality
- no fake enterprise claims
- customer finance isolation reflected in marketing copy

---

# PHASE 13 — FINAL PRODUCTION HARDENING

## Goal

Before serious sales, close operational risks.

## Workstreams

### 13.1 Security audit

- tenant isolation
- owner/customer isolation
- customer finance isolation
- share token security
- system routes
- admin/operator routes
- RLS verification

### 13.2 Observability

- request_id everywhere
- AI runtime logs
- smoke artifacts
- alerting for deploy failure
- error budget basics

### 13.3 E2E

Minimum flows:

- manager login
- create project
- invite/add worker
- worker report with media
- manager approve
- create document
- create estimate
- send estimate to owner
- owner approve estimate
- create decision request
- owner response
- create change order
- proof pack share
- handover readiness

### 13.4 Customer finance isolation tests

Required negative tests:

- owner cannot access manager costs route
- owner cannot access project cost item list
- owner cannot see internal cost overrun
- owner cannot see internal budget summary
- owner cannot see AI internal finance risk
- owner can see only estimates sent to owner
- share proof does not include internal finance
- owner digest excludes internal finance

### 13.5 Release discipline

- CI green
- staging deploy
- pilot smoke
- production deploy
- production smoke
- rollback runbook

## Deliverables

```text
docs/audit/FINAL_PRODUCTION_READINESS_AUDIT.md
docs/audit/FINAL_SECURITY_AUDIT.md
docs/audit/FINAL_E2E_REPORT.md
docs/security/FINAL_CUSTOMER_FINANCE_ISOLATION_AUDIT.md
docs/product/PHASE13_ROADMAP_CLOSURE.md
```

**Note:** There is no separate **Phase 14** product chapter in this file. Section **14** is the Cursor execution template; **§15** is the strategic verdict. Closure of Phase 13 against live criteria is recorded in `PHASE13_ROADMAP_CLOSURE.md` and operator smoke logs.

## Done criteria

- no P0/P1 open
- staging green
- production smoke green
- core E2E green
- customer finance isolation green
- clear launch checklist

---

# 14. CURSOR EXECUTION TEMPLATE

Use this for each phase:

```text
YOU ARE CURSOR.
Act as a Principal Product Engineer + Release Engineer + Security-Aware SaaS Architect.

Project: AISTROYKA.

MISSION:
Execute ONLY the current phase from AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md.

Current phase:
[INSERT PHASE NAME]

GLOBAL RULE:
Customer / owner must never see internal financial state of the construction company.
Customer may only see estimates, additional proposals, approved commercial changes, payment schedule if intentionally configured, and decisions that depend on the customer.

RULES:
1. Do not move to the next phase.
2. Do not add unrelated features.
3. Do not weaken auth, tenant boundaries, RLS or role checks.
4. Do not create fake placeholder UI.
5. Do not mark complete without tests/build and post-audit.
6. Every new API must use contracts/validation where project patterns require it.
7. Every customer/owner/share surface must be security-reviewed.
8. Every owner/customer route must be checked for internal finance leakage.
9. All material changes must be documented.

EXECUTION:
1. Inspect current repo state.
2. Create an implementation plan.
3. Implement incrementally.
4. Run focused tests.
5. Run full validation:
   - bun run lint
   - bun run test
   - bun run build
   - bun run cf:build
6. Create required docs for this phase.
7. Produce final post-audit:
   - what was implemented
   - what was validated
   - open risks
   - customer finance isolation verdict
   - exact blockers if any
   - final verdict YES/NO

CLOSURE RULE:
If there is any meaningful unfinished work, mark the phase NOT CLOSED and list exact next actions.
```

---

# 15. FINAL STRATEGIC VERDICT

The next high-impact sequence is:

1. Live truth verification
2. Manager Daily Control Center
3. Owner / Customer Portal without internal finance
4. Decision Requests
5. Customer Estimates / Commercial Approvals
6. Change Orders
7. Proof Pack

This sequence turns AISTROYKA into a product that construction companies can sell to their customers as transparency and trust.

The correct customer promise is:

> Customer sees progress, proof, documents, estimates for approval, and decisions that depend on them.

The incorrect customer promise is:

> Customer sees the builder company’s internal budget, costs, overruns, margin or financial condition.

Do not expose internal finance to customer.

Build the trust loop first.
