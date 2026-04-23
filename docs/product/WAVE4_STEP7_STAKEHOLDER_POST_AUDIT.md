# Wave 4 Step 7 — Strict post-audit (Stage I)

| # | Area | Result | Notes |
|---|------|--------|-------|
| 1 | Stakeholder access scope | **FULL** | Two roles + invite/revoke/active |
| 2 | Membership model | **FULL** | `project_stakeholders` + tenant viewer on accept |
| 3 | Backend invite/access workflow | **FULL** | Invite, list, revoke, accept API |
| 4 | Policy correctness | **FULL** | Read vs respond split; not owner-only |
| 5 | Manager control surfaces | **FULL** | `StakeholderManagerPanel` |
| 6 | Stakeholder-facing flow | **PARTIAL** | Accept page + portal link; no email automation |
| 7 | Validation strength | **FULL** | Tests + build green |
| 8 | Leakage prevention | **PARTIAL** | Curated APIs unchanged; **tenant viewer** widens workspace surface (P1) |

## Issues

| Severity | Item |
|----------|------|
| **P0** | None |
| **P1** | Accept adds **`tenant_members.viewer`** — workspace-wide RLS may expose more than portal-only; mitigated by portal/route gates for customer payloads, not by tenant RBAC split |
| **P2** | No email send; invite URL manual copy; stakeholder may still open non-portal dashboard routes |

## Hard-rule gate

| Rule | Verdict |
|------|---------|
| No longer *only* project owner semantics for portal/requests | **Pass** |
| Invite/access real | **Pass** |
| Leakage “convincingly controlled” for curated payloads | **Pass**; workspace breadth **P1** |
| Validation not skipped | **Pass** |

**Wave 4 Step 7 closed enough for next sub-step:** **YES**

Rationale: External stakeholder identity and role-aware portal/request access are **implemented and enforced in domain policy**, not UI-only. Remaining gaps are **operational** (email, shell) not falsified architecture.
