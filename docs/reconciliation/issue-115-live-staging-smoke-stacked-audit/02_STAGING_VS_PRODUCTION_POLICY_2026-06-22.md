# Staging vs Production Smoke Policy

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Staging Policy

Allowed in staging with explicit operator approval:

- health/config smoke
- pilot smoke against `https://staging.aistroyka.ai`
- Playwright pilot E2E with dedicated smoke credentials
- temporary isolated smoke users and tenant/project fixtures when cleanup is part of the plan
- AI live-provider gate only if no production claims are made from fallback results

Required:

- classify target Supabase project before mutation
- use dedicated smoke tenant/project/account
- avoid real customer data
- record cleanup evidence
- record base URL and commit SHA
- do not print secrets or JWTs

## Production Policy

Forbidden without a separate explicit operator gate:

- creating/deleting users
- modifying tenant memberships
- creating reports/projects/tasks
- changing Supabase/Vercel/Cloudflare/GitHub settings
- applying migrations
- manual production deploy
- toggling runtime flags

Allowed only with explicit production smoke approval:

- read-only health/config checks
- production pilot smoke through approved workflow gates
- stakeholder finance sanity with dedicated stakeholder account
- narrowly scoped authenticated checks that use pre-existing dedicated smoke users

## When Production Smoke Is Allowed

Production smoke can run only when:

- PR/commit intended for release is approved
- target URL is canonical production `https://aistroyka.ai`
- credentials are dedicated smoke credentials, not personal/admin accounts
- mutation scope is known and accepted
- cleanup is either unnecessary or fully planned
- evidence format is agreed before execution

## Approval

Required approver:

- release operator for staging smoke
- release operator plus platform/data owner for production smoke that can mutate data
- security/data owner for any smoke touching owner/customer/stakeholder finance boundaries

## No Live Customer Mutation Rule

Smoke must never mutate real customer projects, reports, storage, documents, finance records, or owner/customer portal state.

## Data Cleanup Rules

Any temporary smoke data must have:

- unique prefix or marker
- target tenant/project recorded
- created object classes listed
- cleanup command or process
- cleanup verification
- failure escalation path

## Policy Verdict

Staging smoke safe now: PARTIAL.

Production live smoke safe now: NO without explicit operator gate.
