# Monthly review follow-up: atomic quantity and intake persistence

Date: 2026-11-27. Base: `5eeafe9f777b4479ab7655b5191e3c6e1fe38873`.

## Confirmed defects

- PR463: separate `max(revision) + 1`, specification insertion and snapshot
  insertion allowed concurrent requests to collide and could leave a specification
  without a snapshot.
- PR482: a durable extraction run could be committed before its observations;
  retry then treated that incomplete run as a successful reusable result.
- PR487: an unassigned intake draft already bound to an extraction in another
  project could be offered or reused in the wrong project.

## Implementation

The additive migration `20261127172000_quantity_preproject_atomic_create.sql`
provides two authenticated, security-invoker creation functions. Quantity creation
serializes each tenant/project/work-code revision sequence and commits the
specification with its snapshot. Extraction creation commits the run and every
pending observation together, validates the bound intake's project and status,
and returns a complete durable receipt. Actor, tenant/project scope and role
checks apply inside the functions. Members may create only measured or reported
quantity snapshots; owner/admin-only kinds cannot bypass the HTTP policy.

Insertion receipt checks also catch `BEFORE INSERT` triggers that silently skip
a row, rolling the transaction back before returning success. Idempotent request
replays return the existing complete result. UUID receipt comparisons use the
same canonical case as PostgreSQL.

A narrowly scoped private security-definer helper takes a share lock on the
intake source. It checks the current authenticated internal writer, active
account, tenant and project, returns no row data, and grants no update rights.
This lets a manager lock a customer's readable draft while preserving the
creator-only update policy. A concurrent withdrawal or rebinding cannot slip
between validation and commit.

The TypeScript services use these atomic functions without a split-write fallback.
A missing migration produces a persistence-unavailable response. A legacy
incomplete run produces `RUN_INCOMPLETE` (HTTP409); it is not repaired by
inventing missing observations or unrecorded original input. New runs include an
input hash, and a changed-input replay fails explicitly. The intake picker also
excludes drafts bound to another project.

## Verification evidence and rollout boundary

- The isolated SQL harness recreates the old revision collision and incomplete
  extraction state before applying the migration.
- 26 PGlite contracts passed, covering scoped callers, roles, suspended accounts,
  creator-only intake rights, replay identity, partial legacy results and
  rollback after rejected or silently skipped writes.
- An independent combined probe applied the related review/RLS migrations with
  this migration: 28 contracts passed, including the direct member-kind RLS
  restriction and customer-created draft extraction.
- Six native PostgreSQL two-client contracts cover concurrent different/same
  quantity requests, concurrent same-intake and cross-project requests, and both
  withdrawal/extraction lock orders. They run in the new isolated CI workflow.
  The harness refuses remote hosts and requires empty public/auth/app_private
  tables; the CI databases contain only synthetic fixtures.
- This branch is isolated directly from the recorded base. Its full application
  tests, TypeScript and ESLint checks and exact-head hosted SQL/CI results are
  recorded in the PR. Independent source review found no remaining blocker.

No migration was applied to a live database by this patch. Production rollout
still requires the repository's fresh project-scoped migration receipt preflight,
authorized additive apply and release verification. UI/material validation is a
separate independently testable patch.
