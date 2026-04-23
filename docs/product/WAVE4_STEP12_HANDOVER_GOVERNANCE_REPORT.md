# Wave 4 Step 12 — Governance report (Stage C)

## C1. Lifecycle (persisted)

| Status | Meaning |
|--------|---------|
| `in_progress` | Default; delivery ongoing. |
| `handover_ready` | Team cleared computed blockers; ready for formal handover step. |
| `handed_over` | Recorded handover to client (`handed_over_at`, optional `handover_notes` visible to client when appropriate). |
| `completed` | Project closed out in Aistroyka for this phase. |

Transitions are **strictly sequential** (no skipping).

## C2. Readiness gates

- Advancing to **`handover_ready`** or **`handed_over`** requires `computeHandoverReadiness().ready === true`.
- **`completed`** may follow **`handed_over`** without re-checking readiness (closure step).

## C3. Audit

- Each successful transition inserts **`project_handover_events`**.
- Manager UI may attach a **note**; timeline rows do not expose note text to stakeholders (same pattern as change-order transition notes).

## C4. Stakeholder-facing

- **No** blocker list with internal document/request identifiers.
- **Optional** `handover_notes` when status is `handed_over` or `completed`.
