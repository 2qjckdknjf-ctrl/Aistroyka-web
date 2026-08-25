# ADR: Future Agent Tool Layer

**Status:** Accepted (future — not in pilot scope)  
**Date:** 2026-08-24

## Context

Construction software is evolving toward AI agent platforms (competitor agents, MCP ecosystems). AISTROYKA pilot requires governed AI without dangerous autonomy. A future tenant-scoped tool layer should enable controlled agent access without raw database or storage path exposure.

## Decision

**Do not implement a public MCP server in the pilot release.** Document the future tool layer contract now; implement after pilot governance metrics are stable.

## Future tools (read-only default)

| Tool | Scope | Write |
|------|-------|-------|
| `read_project` | tenant + project | No |
| `read_reports` | tenant + project | No |
| `read_evidence` | tenant + project | No |
| `read_open_issues` | tenant + project | No |
| `create_draft_issue` | tenant + project | Draft via policy engine |
| `create_draft_summary` | tenant + project | Draft via policy engine |
| `request_approval` | tenant + project | Workflow signal only |
| `read_audit_status` | tenant + project | No |

## Requirements

- Tenant-scoped and project-scoped credentials (short-lived).
- Explicit OAuth-style scopes; no raw SQL or storage paths.
- Every invocation audited in `ai_action_audit_records`.
- Write operations only through governed policy engine (same as pilot registry).
- No production MCP endpoint until legal + security review passes.

## GCC / locale note

Tool layer must not assume LTR-only; Arabic locale and data residency are future ADR inputs.

## Consequences

- Pilot ships with HTTP APIs + governed action executor only.
- Agent platform becomes Phase post-pilot with reuse of `action-registry.ts` and audit tables.
