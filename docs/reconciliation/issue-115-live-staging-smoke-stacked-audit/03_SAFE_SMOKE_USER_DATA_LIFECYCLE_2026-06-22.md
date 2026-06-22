# Safe Smoke User and Data Lifecycle

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## When Temporary Smoke Users May Be Created

Temporary smoke users may be created only when:

- the target environment is staging, or production mutation has explicit operator + data owner approval
- the Supabase project is positively identified
- the tenant/project is isolated and dedicated for smoke
- the exact roles are defined up front
- cleanup and verification steps are written before creation
- no real customer data is used

## Naming Conventions

Recommended:

- email domain/prefix clearly marks smoke account
- include timestamp or run id
- include role in metadata or issue notes, not in secret values

Examples of allowed naming shape:

- `smoke.manager.<run>@...`
- `smoke.worker.<run>@...`
- `smoke.stakeholder.<run>@...`

Do not document real passwords or tokens.

## Tenant / Project Isolation

Smoke accounts should be attached only to:

- a smoke tenant
- a smoke project
- role-specific memberships needed for the test

Never attach smoke users to production customer tenants unless explicitly approved and documented.

## Auth Admin Key Handling

`SUPABASE_SERVICE_ROLE_KEY` and Auth Admin credentials:

- must never be printed
- must never be committed
- should be used only from trusted local/CI secret contexts
- should be scoped to known active project
- should be avoided when existing dedicated smoke users are sufficient

## Cleanup Requirements

Cleanup must verify:

- temporary Auth users removed or disabled
- tenant memberships removed
- project memberships removed
- temporary reports/tasks/projects/storage objects removed or marked harmless
- no privileged smoke account remains unintentionally active

If cleanup fails, stop and escalate. Do not continue creating more smoke data.

## PR #109 Lessons

PR #109 role-gate verification required isolated non-owner role sessions. The safe path was to create temporary users only in a known smoke tenant/project and then verify cleanup.

When Auth Admin credentials are invalid or unavailable, do not fake role verification. Document blocker and rely on automated tests until a safe path is available.

## Lifecycle Verdict

Auth Admin smoke users safe now: PARTIAL.

Safe only under an isolated tenant/project with explicit approval and cleanup evidence.
