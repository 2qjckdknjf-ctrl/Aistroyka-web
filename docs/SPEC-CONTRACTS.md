# Shared Contracts Specification

**Project:** AISTROYKA.AI  
**Version:** 1.0  
**Status:** Spec (Phase 0.1). No code changes in this document.

---

## 1. Single source of truth: packages/contracts

- **packages/contracts** is the only source of truth for:
  - Request and response **schemas** (Zod),
  - **Types** derived from those schemas (e.g. `z.infer<typeof HealthResponseSchema>`),
  - **API surface** documentation for v1 endpoints (request/response shapes, status codes).
- Web app (`apps/web`) and future mobile apps consume the same package (via workspace or published package) so that client and server share the same types and validation rules.
- No duplicate schema or type definitions in apps; all API boundaries reference **packages/contracts**.

---

## 2. Zod schemas for request and response

- **Health:** e.g. `HealthResponseSchema` (ok, db, aiConfigured, openaiConfigured, aiConfigMissing, authState, supabaseReachable, serviceRoleConfigured, buildStamp, reason?, message?).
- **AI analyze-image:** Request body schema (image_url required, media_id?, project_id?); response schema (stage, completion_percent, risk_level, detected_issues, recommendations); error response schema (error: string).
- **Projects:** List response (projects array, shape of project); create request body; get-by-id response.
- **Tenant:** Invite, members list, accept-invite payloads as needed for v1.
- **Worker (stub):** Placeholder request/response types for future worker endpoints.
- All schemas are **Zod** objects; export both the schema and the TypeScript type (`z.infer<typeof X>`).

---

## 3. How web and mobile consume the same contracts

- **Monorepo:** `packages/contracts` is a workspace package. `apps/web` (and later `apps/ios`, `apps/android` or their API layers) add a dependency on `@aistroyka/contracts` (or workspace reference).
- **Web:** API routes (v1) validate request body with `RequestSchema.parse(body)` or `safeParse`; validate response with `ResponseSchema.parse(data)` before sending (or in tests). Client-side fetch code can import types for typed responses.
- **Mobile:** Generated or hand-written API clients import the same schemas/types; validate responses on the client if desired, or at least use the types for parsing. Shared contracts avoid drift between platforms.

---

## 4. Validation policy at API boundary

- **v1 routes:**
  - **Request:** Validate body (and optionally query) with the contract’s request schema. On failure return **400** with a safe error message (no internal details). Do not proceed with unvalidated input.
  - **Response:** Before sending, validate the handler output with the response schema in development/test; in production, optional to reduce overhead, but recommended for critical endpoints. On validation failure log and return **500** (no stack trace).
- **Legacy /api routes:** May adopt validation incrementally; at minimum v1 routes must validate. Legacy routes can keep current behavior until migrated.
- **No implicit JSON:** Every v1 endpoint that accepts JSON must validate it with a Zod schema. No ad-hoc “trust the body” parsing for v1.

---

## 5. Package layout (target)

```
packages/contracts/
  src/
    schemas/
      health.schema.ts
      ai.schema.ts
      projects.schema.ts
      tenant.schema.ts
    api/
      v1/
        endpoints.ts   # Optional: route list and method/path metadata
        types.ts      # Re-exports and shared types
    index.ts
  package.json
  tsconfig.json
```

- **index.ts** exports all public schemas and types so that `import { HealthResponseSchema, type HealthResponse } from '@aistroyka/contracts'` works.
- **endpoints.ts** can list route paths and methods for documentation or codegen; not required for Phase 0.5 minimal implementation.

---

## 6. Contract tests

- **Minimal contract tests** (in packages/contracts or apps/web): For each schema, test that a valid object parses and that invalid objects (missing required field, wrong type) fail with expected Zod errors. Ensures schema changes are intentional and documented.

---

*End of SPEC-CONTRACTS. Implementation follows in Phase 0.5.*
