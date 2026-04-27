# Wave 4 Step 10 — Governance report (Stage C)

## C1. Lifecycle

Statuses (stored on `project_stakeholder_discussions.status`):

| Status | Meaning |
|--------|---------|
| `open` | Thread created; may be awaiting first action. |
| `awaiting_stakeholder` | Next structured input expected from stakeholder (default after manager creates). |
| `awaiting_manager` | Stakeholder responded; manager to act or resolve. |
| `resolved` | Outcome recorded (`resolution_summary`, `resolved_at`, `resolved_by`). |
| `closed` | Terminal; no further entries. |

**Creation default:** `awaiting_stakeholder` (unless `initial_status` is `open` or `awaiting_manager` / `awaiting_stakeholder` per service validation).

**Entry-driven transitions (service layer):**

- Manager adds entry when status is `awaiting_manager` or `open` → `awaiting_stakeholder`.
- Stakeholder adds entry when status is `awaiting_stakeholder` or `open` → `awaiting_manager` (via RPC for DB).

**Resolve:** Manager-only; sets `resolved`, writes summary, appends `resolution_note` entry duplicating summary for audit trail.

**Close:** Manager-only; sets `closed` (no duplicate entry required).

## C2. Structured entry kinds

| `entry_kind` | Use |
|--------------|-----|
| `question` | Clarifying question. |
| `clarification` | Factual clarification. |
| `option_selected` | Explicit choice (payload may carry option id in future). |
| `feedback` | Stakeholder or manager feedback. |
| `resolution_note` | **Manager-only** (enforced in service); also used when resolving. |

## C3. Audit-friendly fields

- **Who:** Manager detail includes `author_user_id` per entry; **public** detail strips author identifiers (stakeholder-safe list).
- **What changed:** Chronological entries + discussion status + resolution fields.
- **What still needs action:** Derived from `status` (`awaiting_*`).

## C4. Limitations (by design)

- No per-entry edit/delete after post (append-only audit trail).
- `payload` on entries is reserved for structured extensions; not heavily used in UI yet.
