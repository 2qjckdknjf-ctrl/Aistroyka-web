# B4 — Package / SDK naming alignment — Aistroyka

**Date:** 2026-03-16

---

## Packages in monorepo workspaces

| Package | Role | Web app runtime? |
|---------|------|------------------|
| `@aistroyka/contracts` | Zod / shared API types | **Yes** — imported by `apps/web` |
| `@aistroyka/contracts-openapi` | OpenAPI JSON build | **Build-time** artifact |
| `apps/web` | Next.js application | **Yes** |

---

## `@aistroyka/api-client` (`packages/api-client`)

- **Truth:** Optional **TypeScript SDK** for external API consumers; depends on `@aistroyka/contracts`.  
- **Not in default web workspaces graph** — not required for `apps/web` build.  
- **No imports** from `apps/web` production code.  
- **SAFE applied:** `package.json` **description** field states SDK role and non-runtime use for web.  
- **README** — already states not used by `apps/web` at runtime.

---

## Misleading wording corrected (surfaces)

- Implication that api-client is the web app’s HTTP layer — **false**; web uses route handlers + `/api/v1`.  
- `SYSTEM_REPOSITORY_MAP.md` — api-client line = optional SDK.

---

## Deferred

- Renaming package to `@aistroyka/sdk` or npm publish — product decision.  
- Adding `api-client` to root workspaces — would change install graph.
