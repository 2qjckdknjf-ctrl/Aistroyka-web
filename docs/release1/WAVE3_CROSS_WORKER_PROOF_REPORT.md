# Wave 3 — Cross-worker proof report

**Date (UTC):** 2026-03-28

## Goal

Prove **worker A** cannot read **worker B’s** real report (or task) by ID — not only bogus UUID 404.

## Second worker identity

**Status:** **Not available** in this automated environment.

- No second `SMOKE_*` user in documented env for this run.
- No GitHub/CLI access to seed two workers in the same tenant without explicit operator action in Supabase/dashboard.

## What was not proven

- Peer-owned report ID denied to another worker JWT.
- Peer-owned task denied to non-assignee (beyond bogus UUID 404).

## Strongest substitute performed

- **Bogus UUID** with real worker JWT → **404** for both `/api/v1/tasks/:id` and `/api/v1/reports/:id` (lite clients).  
- This **does not** satisfy the “real peer-owned entity” requirement (per mission H5).

## Blocker

**Exact blocker:** No **second authenticated worker user** + **known peer-owned report/task row** available to the operator session without additional tenant seeding or credentials.

## Verdict

**Cross-worker denial (strict):** **OPEN** — cannot mark **FULL** until two real identities and a peer-owned resource are exercised.
