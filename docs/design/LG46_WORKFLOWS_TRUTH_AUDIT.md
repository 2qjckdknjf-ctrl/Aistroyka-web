# LG-4.6 Workflows Truth Audit

**Date:** 2026-06-19  
**Route:** `/[locale]/workflows`  
**Method:** Trace every workflow claim to code; classify LIVE / PARTIAL / PLANNED  
**Mode:** Audit only — no copy changes

---

## Marketing strings scanned

Page namespace `public.workflows` plus layout/footer indirect references.

| Term / pattern | On page? |
| --- | --- |
| live / real-time / instant | No “real-time/instant” on page |
| automatic / automation | Yes — hedged in positioning + ex labels |
| autonomous | No |
| AI-powered / predictive / intelligent | Indirect via ex4 + related AI Control |
| BPM | Explicitly negated in meta + positioning |

---

## Claim-by-claim trace

### Hero & metadata

| Claim | Classification | Code / product truth |
| --- | --- | --- |
| “Operational workflow paths” | PARTIAL | Paths exist as **manual + notification** chains; full automation PLANNED |
| “Workflow automation is partial today” | **LIVE (accurate)** | Matches noop dispatcher + partial notifications |
| “Configurable rules engine is planned” | **LIVE (accurate)** | `workflow-definitions.ts` scaffold; comment says replace with DB |
| “Examples show direction, not guaranteed automation” | **LIVE (accurate)** | Correct disclaimer |
| meta: “automation engine expanding; not full BPM today” | PARTIAL truth | Engine **code exists** but actions noop — “expanding” is roadmap language (P2) |

### Example paths (ex1–ex5)

| Example | Page label | Classification | Implementation trace |
| --- | --- | --- | --- |
| **ex1** Issue detected → notify manager | “notifications partial” | **PARTIAL** | `createIssue` → `notifyProjectManagers` (**LIVE**). “Detected” implies auto-detection — issues are **created**, not autonomously detected. Notification channel PARTIAL (in-app; not all push/email paths). |
| **ex2** Task overdue → escalate | “manual follow-up today” | **PARTIAL** | Overdue tasks surface in project status / AI signals / manager actions. **No** auto-escalation workflow; `task_overdue` trigger + `notify_manager` action = **noop**. Label honest. |
| **ex3** Missing photo → request update | “manager review” | **PARTIAL** | `getMissingEvidenceInsights`, manager action recommendations (**LIVE**). Auto `request_missing_evidence` action = **noop**. Human review required — accurate. |
| **ex4** Report submitted → AI summary | “partial — see Construction AI” | **PARTIAL** | Submit → manager notify (**LIVE**). `enqueueJob(ai_analyze_report)` (**LIVE** enqueue). `handleAiAnalyzeReport` = **no-op sentinel** (no summary generated). Copilot summaries on-demand (**PARTIAL**). Workflow `enqueue_copilot_summary` = **noop**. |
| **ex5** Risk threshold → create alert | “planned rules engine” | **PLANNED** | `create_alert_record` noop. Product `alerts` table used for SRE/AI-usage/admin — not tenant risk rules. `risk_detected` webhook maps to domain event but workflow not wired. Label honest. |

### Benefits (b1–b4) — **truth gap**

| Benefit | Implied claim | Classification | Issue |
| --- | --- | --- | --- |
| **b1** Faster reactions when signals reach the right role | Present-tense outcome | **PARTIAL** | Notifications LIVE for subset of events; not all signals routed automatically |
| **b2** Less manual follow-up as automation expands | Future hedged | **PLANNED / PARTIAL** | Honest — “as automation expands” |
| **b3** Stronger accountability with traceable records | Present-tense outcome | **LIVE** | Approval events, audit emit, traceability repos |
| **b4** Predictable project control without chat-only updates | Present-tense outcome | **PARTIAL** | Structured records LIVE; “predictable control” overstates automation maturity |

**P1 finding:** Examples use LIVE/PARTIAL/PLANNED inline; benefits do not — inconsistent trust surface.

### Related links & CTA (downstream claims)

| String | Classification | Notes |
| --- | --- | --- |
| relatedAiControlDesc: “what can trigger workflow signals today” | PARTIAL | AI analysis jobs partial; not full trigger bus |
| relatedMobileDesc: “feed operational workflow paths” | LIVE | Field capture → reports/tasks → notifications |
| relatedImplementationDesc: “rollout … workflow expansion” | LIVE | Accurate scope boundary |
| ctaSubtitle: “align alerts, reviews, and rollout scope” | LIVE | Pilot/consulting language — OK |

---

## Domain trace matrix (audit categories)

| Category | Marketing on page? | LIVE | PARTIAL | PLANNED |
| --- | --- | --- | --- | --- |
| **Approvals** | Indirect (b3, positioning) | Report + document approval queues, decision API | Change-order respond paths | — |
| **Notifications** | ex1, positioning | Manager inbox, issue/report submit | Not all events; push partial | — |
| **Issues** | ex1 | Create + notify | Auto detection | — |
| **Documents** | — | Upload, review, owner decision | — | — |
| **AI review** | ex4, related AI | Analysis jobs, copilot on-demand | Report job no-op; human review required | Auto summary on trigger |
| **Stakeholder visibility** | — | Client requests, stakeholder notifications | Reminder cadence finite | — |
| **Reporting** | ex4 | Submit, approval, timeline events | AI summarize | — |
| **Escalation** | ex2 | — | Manager manual follow-up | Rule-based escalate |
| **Automation** | positioning, ex5 | Recurring operational rules (4 kinds) | Webhook → event publish | Rules engine + noop dispatcher |
| **Reminders** | — | Stakeholder invite/request reminders | — | — |

---

## Code anchors (reference)

```
apps/web/lib/workflows/workflow-engine.ts       — engine logic (no production wiring found)
apps/web/lib/workflows/action-dispatcher.ts     — noop handlers unless registered
apps/web/lib/workflows/workflow-definitions.ts  — DEFAULT_WORKFLOW_RULES scaffold
apps/web/lib/domain/approvals/pending-approvals.service.ts
apps/web/lib/domain/issues/issue.service.ts
apps/web/lib/domain/reports/report.service.ts
apps/web/lib/platform/jobs/job.handlers/ai-analyze-report.ts  — no-op handler
apps/web/lib/domain/recurring-operations/recurring-operations.runner.ts
apps/web/lib/domain/stakeholder-notifications/stakeholder-notifications.reminders.ts
apps/web/lib/webhooks/webhook-handler.ts
```

---

## Overclaim downgrade recommendations (for LG-4.6 implementation — not applied)

| Current | Recommended | Reason |
| --- | --- | --- |
| ex1 “Issue detected” | “Issue logged” or “Issue raised” | No autonomous detection |
| ex4 “AI summary generated” | “AI analysis queued (partial)” | Report handler no-op |
| b1 present tense | Tag PARTIAL or merge into matrix | Notification coverage incomplete |
| b4 “Predictable project control” | “Structured records vs chat-only updates” | Removes automation implication |
| meta “engine expanding” | “Rules engine planned; recurring checks partial today” | Matches code |

---

## Truth risk summary

| ID | Severity | Finding |
| --- | --- | --- |
| TR-1 | P1 | Benefits b1/b4 overstate current automation vs labeled examples |
| TR-2 | P2 | ex1 “detected” slightly strong — create-driven issues |
| TR-3 | P2 | ex4 “summary” — enqueue only; handler no-op |
| TR-4 | P2 | metaDescription “engine expanding” — roadmap vs runtime |
| TR-5 | — | No P0 autonomy/BPM/real-time violations | Copy denies BPM; no autonomous claims |

---

## Accessibility & mobile (truth-adjacent UX notes)

| Check | Status | Severity |
| --- | --- | --- |
| Single h1 | Pass (`title`) | — |
| Section h2 hierarchy | Pass | — |
| Related `aria-labelledby` | Pass | — |
| Example list semantics | Fail (div stack) | P2 |
| Keyboard / focus on cards | N/A (non-interactive cards) | — |
| CTA focus | Pass via `PublicHeroCTA` | — |
| Mobile 320–768 structural review | Not browser-verified this audit | P3 |

---

## Final truth verdict

**WORKFLOWS NOT READY**

The page’s **positioning paragraph and ex1–ex5** are largely honest and among the better truth surfaces on the public site. **Benefits b1/b4** and the **examples-vs-benefits inconsistency** block a READY verdict until LG-4.6 implementation aligns outcome copy with LIVE/PARTIAL/PLANNED discipline (matching Implementation and API pages).

**No P0 truth violations** (no BPM suite claim, no autonomous AI, no real-time orchestration promise).
