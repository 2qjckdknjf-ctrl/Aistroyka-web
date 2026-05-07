# Phase 6 Proof Pack Share Link Security

Date: 2026-05-07

Roadmap phase: 6 - Proof Pack / Before-After Evidence

## Share Model

Table:

```text
proof_pack_shares
```

Fields:

- `tenant_id`
- `project_id`
- `token`
- `expires_at`
- `revoked_at`
- `created_by`

## Public Route

```text
/share/proof/:token
GET /api/v1/share/proof/:token
```

The public route resolves token to project and then assembles a customer-safe projection.

## Security Controls

- token is random UUID-derived value
- share is project-scoped
- revoked shares return not found/revoked
- expired shares return expired
- tenant id is not exposed in payload
- internal user ids are not exposed
- raw document object paths are not exposed
- internal finance is not exposed

## Validation

Focused test verifies proof pack output excludes internal finance and internal document storage fields.

```text
PHASE6_FOCUSED_STATUS focused=0 lint=0
```

Full validation:

```text
PHASE6_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 6 Verdict

PHASE 6 CLOSED: YES

