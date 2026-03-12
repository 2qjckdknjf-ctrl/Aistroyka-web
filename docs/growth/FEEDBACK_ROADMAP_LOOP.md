# Feedback → Roadmap Loop

**Phase 8 — Pilot Rollout & Growth**  
**System to capture feedback, triage, and update roadmap.**

---

## Feedback capture pipeline

1. **Inbound:** Support (email/chat), pilot check-in calls, in-app feedback (if available), and any structured survey.
2. **Log:** Every piece of feedback is logged with: date, source (pilot/customer name or “anonymous”), type (bug / UX / feature request), summary, severity/impact (if bug), and optional request_id or ticket id.
3. **Attribution:** Where possible, tenant_id, user role (manager/worker), and app version; no PII in shared backlog.
4. **Cadence:** Support logs daily; product/CS reviews log weekly and tag pilot vs post-pilot.

**Tool:** Spreadsheet, Notion, Jira, or dedicated feedback tool—pick one and document where feedback lives.

---

## Feature request scoring

- **Criteria (simple):**  
  - **Demand:** How many pilots/customers asked? (count)  
  - **Impact:** Does it unblock a segment or increase retention? (high/medium/low)  
  - **Effort:** Rough dev cost (S/M/L).  
  - **Strategic fit:** Aligns with “assign → report → review” and visibility? (yes/no)
- **Score:** Combine (e.g. demand × impact / effort) or use a 1–5 scale; rank for roadmap.
- **Rule:** No commitment in pilot; “we’ll consider and prioritize” and log.

---

## Bug vs UX vs feature triage

| Type | Definition | Owner | Outcome |
|------|------------|--------|---------|
| **Bug** | Incorrect or broken behavior; reproducible. | Engineering | Fix; severity (P0–P3) drives order. |
| **UX** | Confusing, hard to use, or inconsistent; not broken. | Product | Backlog; improve in next iteration or when capacity allows. |
| **Feature request** | New capability or change in product behavior. | Product | Score (above); add to roadmap or backlog or decline with reason. |

**Triage:** First responder (CS/support) assigns type; ambiguous cases go to product. Document decision in log.

---

## Roadmap update cadence

- **Weekly (during pilot):** Triage new feedback; update bug backlog and UX/feature list; no formal roadmap change every week.
- **Bi-weekly or monthly:** Product reviews scored feature requests; update roadmap (next quarter or next 2 sprints); communicate “what we’re doing next” to CS and, if useful, to pilots.
- **End of pilot:** Retro; feedback summary; roadmap impact (themes, top 3–5 requests); share with pilot sponsor.

**Rule:** Roadmap is a single source of truth (doc or tool); changes are dated and brief reason noted.

---

## Decision log

- **What:** Key decisions that affect product or pilot (e.g. “We will not support X in pilot”; “We prioritize Y for Q2”).
- **When:** Date of decision.
- **Who:** Decision-maker or meeting.
- **Why:** One-line reason or link to feedback/strategy.
- **Where:** Section in this doc, or dedicated DECISION_LOG.md, or in roadmap tool.

**Example:** “2026-03-10: Pilot feedback—no custom fields in pilot; log as feature request for Enterprise. Owner: Product.”

---

## Summary

- **Capture:** All feedback logged with type, source, summary, attribution (tenant/role/version).  
- **Triage:** Bug → eng; UX → backlog; feature → score and roadmap.  
- **Score:** Feature requests by demand, impact, effort, fit.  
- **Cadence:** Weekly triage; bi-weekly/monthly roadmap update; decision log for material decisions.
