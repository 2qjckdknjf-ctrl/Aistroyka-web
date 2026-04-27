# @aistroyka/contracts-openapi

Generates OpenAPI 3.0 spec from `@aistroyka/contracts` Zod schemas.

## Location (Release 1)

Archived under `docs/_archive/packages-contracts-openapi` (not a root workspace package). Regenerate from repo root:

```bash
bash scripts/generate-openapi.sh
```

Or manually:

```bash
cd docs/_archive/packages-contracts-openapi
bun install
bun run build
```

Output: `dist/openapi.json`.

## Usage

- **CI:** Add a step that runs `npm run build` and optionally validates `dist/openapi.json` (e.g. with `@apidevtools/swagger-parser` or Redocly CLI).
- **Mobile SDK:** Use `dist/openapi.json` with OpenAPI Generator to produce Swift (iOS) or Kotlin (Android) clients. See repo root `docs/` for versioning and generator commands.

## Pipeline

Contracts (Zod) → this package → openapi.json → API docs / SDK generation.
