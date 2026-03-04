# @aistroyka/contracts-openapi

Generates OpenAPI 3.0 spec from `@aistroyka/contracts` Zod schemas.

## Build

```bash
cd packages/contracts-openapi
npm install
npm run build
```

Output: `dist/openapi.json`.

## Usage

- **CI:** Add a step that runs `npm run build` and optionally validates `dist/openapi.json` (e.g. with `@apidevtools/swagger-parser` or Redocly CLI).
- **Mobile SDK:** Use `dist/openapi.json` with OpenAPI Generator to produce Swift (iOS) or Kotlin (Android) clients. See repo root `docs/` for versioning and generator commands.

## Pipeline

Contracts (Zod) → this package → openapi.json → API docs / SDK generation.
