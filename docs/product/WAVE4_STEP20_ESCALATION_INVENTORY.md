# Wave 4 Step 20 — Governance scope inventory (Stage A)

## Purpose

Define the **smallest justified** cross-project governance scope for Aistroyka: explicit escalation cases, not a generic ticket system or PMO suite.

## A1 — Portfolio-level signals reviewed

Existing product surfaces already expose:

| Signal area | Where it appears | Relevance to governance |
|-------------|------------------|-------------------------|
| Critical / unstable project health | Portfolio command rows, AI health | Multi-project critical state |
| High risks, evidence gaps | Portfolio summary, review context | Portfolio risk spanning projects |
| Budget pressure / over budget | Portfolio rows, cost summaries | Budget / control escalation |
| Handover blockers | Handover readiness, workload | Cross-project handover pressure |
| Recurring operational escalations | Recurring ops, workload | Repeated operational heat (adjacent, not duplicated here) |
| Executive review attention | Review packs | Leadership-facing summary |

## A2 — Minimal governance case triggers (chosen)

**In scope for Step 20 (supported by the case model + UI):**

1. **Multi-project intervention** — A leadership decision is needed that **explicitly spans more than one project** (mandatory `project_ids` on create).
2. **Cross-project risk / portfolio pressure** — Formal capture when portfolio signals imply **coordinated** response (case rationale references real context; user creates the case).
3. **Leadership decision required** — Every case records `decision_required`; closure paths require `decision_outcome` where the lifecycle demands it.

**Out of scope (deferred):**

- Automatic case creation from every “critical” portfolio row (no background job inventing cases).
- Mapping every defect or stakeholder thread into a governance case.

## A3 — What a governance case must capture (this step)

| Field / concept | Implementation |
|-----------------|----------------|
| Title | `title` |
| Why escalated | `rationale`, `decision_required` |
| Status | Finite lifecycle (`open` → … → `archived`) |
| Severity | `medium` \| `high` \| `critical` |
| Affected projects | `governance_case_projects` + optional per-project `note` |
| Decision / outcome | `decision_outcome`, `decided_by`, `decided_at`, `resolved_at` |
| Ownership | `created_by`, optional `owned_by` |
| Timestamps | `created_at`, `updated_at` |

## A4 — Explicitly deferred

- Company-wide committee workflow and voting.
- Advanced org hierarchy approvals.
- Enterprise risk register as a standalone product.
- Legal case management, OKR strategy platform, HR org charts.
- Android-specific expansion for this layer.

## Conclusion

Scope is **finite, auditable governance cases** with **mandatory multi-project linkage**, integrated into portfolio summary, review packs, and leadership workload—without auto-spawning cases from every signal.
