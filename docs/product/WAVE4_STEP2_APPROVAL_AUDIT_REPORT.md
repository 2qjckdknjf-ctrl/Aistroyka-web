# Wave 4 Step 2 — Audit & history (Stage C)

## What is recorded

### Append-only (`report_approval_events`)

Each row includes:

- **Target:** `report_id` (+ implicit tenant)
- **Action:** `event_type` (submitted / approved / rejected / changes_requested)
- **Actor:** `actor_user_id` (worker on submit/resubmit; manager on decisions)
- **Note:** optional text (manager note; worker submit does not set note here)
- **Time:** `created_at`

### Operational audit (`audit_logs`)

- **`report_submit`** — unchanged in `report.service` (submit flow)
- **`report_review`** — PATCH now stores `details: { status, note }` (full note for admin diagnostics)

## Read model

- **GET `/api/v1/reports/:id/approval-history`**
  - Returns `{ source: "report_approval_events", events: [...] }` when rows exist (chronological).
  - Else `{ source: "audit_logs_legacy", events: [...] }` for backward compatibility.

## Explainability

- UI maps `event_type` / legacy `action` to human labels (“Submitted for review”, “Approved”, …).
- Notes render under the line when present.

## Limits

- Not a legal-grade e-signature system; immutable events are DB-enforced append-only with no UPDATE policy, not cryptographic chaining.
