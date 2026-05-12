# Phase 3 — Client request events audit

**Table:** `project_client_request_events`  
**Date:** 2026-05-07

## Requirement (roadmap §754–756)

Log every decision state change.

## Inventory (service mutations)

| Transition | Function | Event (before fix) | Gap |
|------------|----------|--------------------|-----|
| Create | `createClientRequest` | `created` with kind/action_mode | Missing `decision_type` in payload (useful for audit). |
| Stakeholder respond | `respondToClientRequest` | `responded` with `{ kind }` only | Missing `response_value` (and thus incomplete trail for approve/reject/choice/text). |
| Manager cancel | `patchClientRequestByManager` | `cancelled` with `{}` | Missing prior `status`. |
| Manager complete | `patchClientRequestByManager` | `completed` with `{}` | Missing prior `status`. |

## Resolution (implemented)

- **`created`** — payload includes `kind`, `action_mode`, `decision_type` (nullable).  
- **`responded`** — payload includes `kind`, `response_value` (domain-safe: approve/reject, choice index, short feedback, etc.).  
- **`cancelled` / `completed`** — payload includes `prior_status`.

## Non-goals / residual

- **Transactional guarantee:** Event insert is separate from row update (no single DB transaction in app layer). If insert failed, state could theoretically diverge; ops should monitor DB errors. Future hardening: RPC wrapping both or outbox.  
- **Payload size:** Long `feedback_text` is stored as `response_value` on the row; event mirrors that string — acceptable for manager-only history.

## Verdict

**Complete for Phase 3** — all state-changing paths emit enriched audit events suitable for manager `history` on `getClientRequest`.
