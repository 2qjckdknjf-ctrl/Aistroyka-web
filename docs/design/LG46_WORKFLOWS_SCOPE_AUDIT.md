# LG-4.6 Workflows Scope Audit

**Date:** 2026-06-19  
**Route:** `/[locale]/workflows`  
**Mode:** Audit only

---

## Scope definition

### In scope (page responsibility)

- Operational **trigger → action** paths across construction ops  
- Honest **LIVE / PARTIAL / PLANNED** labeling for automation  
- Explicit **non-BPM** boundary  
- Cross-links to AI, Mobile, Implementation, Contact  
- Pilot-oriented CTA for mapping alerts and review scope  

### Out of scope (defer to other routes)

| Topic | Owner route |
| --- | --- |
| Module catalog | `/features` |
| Stack narrative & capability map | `/platform` |
| Field UX walkthrough | `/mobile` |
| Photo/report AI pipeline | `/ai-construction-control` |
| Manager Q&A assistant | `/copilot` |
| Deployment phases & adoption roles | `/implementation` |
| Enterprise governance evaluation | `/enterprise` |
| Security & isolation depth | `/security` |
| REST/API automation surface | `/api` |
| Connector catalog | `/integrations` |
| Commercial engagement | `/pricing` |
| Role-based entry points | `/solutions` |

---

## Content scope map (current page)

| Block | Keys | Scoped correctly? | Notes |
| --- | --- | --- | --- |
| Hero title | `title`, `heroTitle` | Yes | Operational paths, not BPM |
| Positioning | `positioning` | Yes | Strongest honesty anchor on page |
| Examples | `ex1`–`ex5` | Yes | Each carries partial/planned qualifier |
| Benefits | `b1`–`b4` | **No** | Scope creep into outcomes without status labels |
| Related | 4 links | Partial | Missing Platform/Features/Pricing |
| CTA | `ctaTitle`, `ctaSubtitle` | Yes | Pilot + contact alignment |

---

## Implementation scope (codebase truth)

What the product actually implements vs what the page may imply.

### LIVE (proven in code)

| Capability | Implementation anchor |
| --- | --- |
| Report approval queue | `listPendingApprovals` — submitted reports + under_review documents |
| Document owner decisions | `performOwnerDecision` — approve/reject/request_changes |
| Report submit → manager notification | `report.service.ts` → `notifyProjectManagers` |
| Issue create/status → manager notification | `issue.service.ts` |
| Manager notifications inbox | `manager_notifications` table + `/api/v1/notifications` |
| Stakeholder notifications (invite, client request, reminders) | `stakeholder_notifications` + reminder runner |
| Client request workflow | `project_client_requests` + respond API |
| Recurring operational rules (finite kinds) | `recurring-operations.runner.ts` — **not** generic BPM |
| Audit / traceability for approvals | `report_approval_events`, document audit emit |
| Task/report dashboard “manager actions” | `manager-actions.service.ts` |

### PARTIAL (exists but manual, limited, or stubbed step)

| Capability | Gap |
| --- | --- |
| Task overdue “escalation” | Signals + manager actions; no automatic escalation chain |
| Missing evidence “request” | Insights and recommendations; `request_missing_evidence` action is noop |
| Report → AI analysis | Job `ai_analyze_report` enqueued; handler is no-op sentinel |
| Issue “detection” | Manual/create-driven; not autonomous site detection |
| Notifications breadth | Not all event types push to all roles |
| Webhook → domain event | `webhook-handler.ts` publishes events; workflow engine not wired end-to-end |

### PLANNED (scaffold only)

| Capability | Evidence |
| --- | --- |
| Configurable rules engine | `workflow-engine.ts` + `DEFAULT_WORKFLOW_RULES` — not DB-backed |
| Workflow actions | `action-dispatcher.ts` — all handlers default to **noop** |
| Risk threshold → alert record | `create_alert_record` noop; SRE alerts are ops/AI-usage not product rules |
| Auto copilot summary on trigger | `enqueue_copilot_summary` noop |
| Customer-configurable BPM | Explicitly disclaimed in copy ✓ |

---

## Competitive scope traps (avoid in future copy)

| Trap | Current page status |
| --- | --- |
| “Workflow engine” as product centerpiece | Mitigated — positioning says planned |
| Zapier/IFTTT-style automation | Not claimed |
| Autonomous AI decisions | Not claimed |
| Real-time orchestration | Not claimed |
| Full document BPM | Not claimed — approvals referenced indirectly only |

---

## Recommended scope for LG-4.6 implementation (paper)

1. **Rename mental model** from “Example paths” to **“Automation readiness catalog”**.  
2. **One status matrix** covering: Approvals, Notifications, Issues, Evidence, Escalation, AI triggers, Scheduled ops, Rules engine.  
3. **Single paragraph** on recurring operational rules — finite Wave 4 kinds, not generic automation platform (`recurring-operations.types.ts` comment).  
4. **Remove or relabel benefits** — either drop section or tag each bullet LIVE/PARTIAL/PLANNED.  
5. **Expand related links** without owning peer content — Platform + Features mandatory.

---

## Scope verdict

| Criterion | Pass? |
| --- | --- |
| Page avoids owning Features/Platform catalogs | Yes |
| Page avoids BPM/engine overclaim in examples | Yes |
| Page scope matches unique automation-readiness question | Partial — benefits blur boundary |
| Code truth reflected in primary content | Partial — examples yes, benefits no |
| Navigation scope supports discovery | No — weak inbound |

**SCOPE: NOT CLOSED** — benefits section and navigation scope must be tightened before **WORKFLOWS READY**.
