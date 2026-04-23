# Wave 4 Step 16 — Priority / urgency governance

## C1 — Priority model

- **urgent**: budget over planned; blocking punch defects; leadership portfolio critical; handover with many blockers (see below)
- **high**: aggregate pending reports queue; manager signals from `priorityForManagerSignal` (thresholds on handover blockers, overdue milestones, pending decisions, aftercare)
- **normal**: remaining manager items

**Stakeholder**: `priorityStakeholder()` currently returns **high** for all stakeholder items (explicit, simple; not ML).

## C2 — Due / urgency semantics (`WorkloadDueState`)

- **overdue**: manager overdue milestones item when count > 0
- **blocking**: budget over planned; blocking defects; handover not ready
- **waiting_on_you**: stakeholder items
- **waiting_on_team**: pending reports aggregate; documents; aftercare; discussions awaiting manager; leadership portfolio line
- **none**: unused in current emitters

## C3 — Human-readable reason

Every item sets `reason` from counts or `primaryReason` (portfolio) — no empty reasons.

## Limitations

- No per-milestone due dates in workload row (only counts).
- Stakeholder priority is not differentiated between request vs discussion.
- Change orders not in priority graph this step.
