# Slice 09 — AI Risks & Analytics (Surface I)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

- AI requests list + job detail on glass.
- `IntelligenceCard` and operational banner primitives switched to Liquid Glass (project intelligence, risk radar, evidence, recommendations).
- Dashboard AI insights / operating center panels on glass.
- Evidence links and recommended actions unchanged.

## Out of scope

- New AI models or LEVEL 4 claims.
- Decorative AI orbs.

## Validation

```bash
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
