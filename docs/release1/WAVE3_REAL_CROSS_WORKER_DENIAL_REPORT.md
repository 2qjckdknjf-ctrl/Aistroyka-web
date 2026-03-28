# Wave 3 — Real cross-worker denial report

**Date (UTC):** 2026-03-28

## Goal

Prove **worker A** cannot read **worker B’s** report (and optionally task) where B owns the row in the same tenant.

## Identities

| Role | Available? |
|------|------------|
| Worker A (pilot smoke user) | **Yes** |
| Worker B (distinct `user_id`, same tenant, worker-capable) | **No** in this environment |

## Peer-owned entities

- **Peer-owned report (user B):** **Not created** — requires user B.
- **Peer-owned task (assigned to B):** **Not created** — requires user B + assignment.

## Attempted / available substitute

- **Bogus UUID** with worker A → **404** (already verified in prior sprint) — **does not** satisfy “real peer-owned entity” requirement.

## Exact external blocker

To complete **FULL** cross-worker denial proof, an operator must:

1. **Create or invite** a second user in the **same tenant** with **worker** access (e.g. tenant invitation + accept, or Supabase Auth + `tenant_members` row with appropriate role — exact schema per product rules).
2. **Create** (or use) a **report** whose `user_id` is **B** (or a **task** assigned only to **B**).
3. Call **`GET /api/v1/reports/{id}`** (and optionally **`GET /api/v1/tasks/{id}`**) with **A’s** JWT and lite headers.

**Why this agent could not do it:** Local env exposes **one** smoke user only; no **service role** key for Auth admin / SQL seeding; no second mailbox flow executed.

## Classification

| Item | Status |
|------|--------|
| Cross-worker denial (peer-owned) | **OPEN** |
| External blocker documented | **YES** |
