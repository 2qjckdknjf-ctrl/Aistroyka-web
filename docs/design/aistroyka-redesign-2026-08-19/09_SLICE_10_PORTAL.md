# Slice 10 — Owner / Client Portal (Surface J)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

- Stakeholder portal project list on glass.
- Client portal home (progress, milestones, documents, decisions, handover) on glass.
- Related client portal sections: notifications, workload, daily digest, discussions list, service requests list.
- Owner project view chrome on glass.
- No contractor internal finance exposed (no cost/budget/margin added).

## Out of scope

- Changing portal RBAC or customer-finance isolation.
- Expanding stakeholder allow-list beyond portal home + client subtree (see Slice 14 for shell).

## Validation

```bash
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
