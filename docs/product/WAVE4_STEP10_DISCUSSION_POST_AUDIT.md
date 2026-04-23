# Wave 4 Step 10 — Strict post-audit (Stage I)

## Dimension classification

| # | Dimension | Rating | Evidence |
|---|------------|--------|----------|
| 1 | Discussion scope selection | **FULL** | Four kinds + explicit non-goals; documented in inventory. |
| 2 | Discussion model | **FULL** | Tables + entries + linkage columns; append-only entries. |
| 3 | Backend workflow | **FULL** | Service + API + RLS; portal status transition via `SECURITY DEFINER` RPC (required once internal-only discussion updates were identified). |
| 4 | Governance / lifecycle | **FULL** | Status machine + entry kinds + manager-only resolve/close + public DTO redaction. |
| 5 | Manager discussion UX | **FULL** | Create panel + detail (history, post, resolve, close). |
| 6 | Stakeholder discussion UX | **FULL** | List + detail + structured post when allowed. |
| 7 | Integration strength | **PARTIAL** | Timeline integration **FULL**; stakeholder notifications for new activity **OPEN** (not wired). |
| 8 | Validation strength | **FULL** | Vitest green including new portal RPC branch test; production build green. **PARTIAL** only for lack of HTTP route tests. |

## Remaining issues

### P0

- None identified at audit time (portal status RPC closes a functional gap that would otherwise block stakeholder participation).

### P1

- **Migrations must be applied** in each Supabase environment (`20260401140000`, `20260401150000`) before production behavior is correct.
- **No HTTP-level tests** for stakeholder-discussion API routes (policy is exercised via service tests).

### P2

- **Inline “start discussion”** from document/milestone/request screens not implemented; linkage is manual UUID on create.
- **Push/email** on new discussion or reply not implemented.

## Wave 4 Step 10 closure decision

**Is Wave 4 Step 10 closed enough to move to the next sub-step: YES**

**Rationale (strict):**

- Discussions are **persisted** and governed, not UI-only.
- Resolution is **real** (mandatory summary + `resolution_note` + timestamps).
- **Leakage** is controlled for stakeholders (no author IDs on public detail).
- **Validation** is not skipped: full web test suite + production build succeeded.
- **PARTIAL** is limited to integration (notifications) and optional HTTP tests — documented as P1/P2, not hidden.

If migrations are not applied in an environment, operational behavior is **not** considered “closed” there — that is a **deployment** gate, not a code-complete gate.
