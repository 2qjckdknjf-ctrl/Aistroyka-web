# AIS-MATERIAL-008 collection GET — 2026-11-26

Closes the documented gap: create path existed under acceptances; project collection GET was missing (404 HTML).

## Change

| Surface | Detail |
|---|---|
| `GET /api/v1/projects/:id/materials/requirement-drafts` | List drafts (tenant/project scoped, internal writer, no prices) |
| `listMaterialRequirementDrafts` | Domain helper + unit tests |
| Manager `ProjectQuantitiesPanel` | Lists existing drafts (en/ru/es/it) |

## Validation

- `bunx vitest run lib/domain/materials/material-requirement-draft.test.ts` → **8 PASS**
- `bun run i18n:check` → OK (activation/dashboard/dashboardDetail)

## Explicit non-claims

- No purchasing / pay / supplier message.
- Staging live list smoke waits for deploy of this SHA (runtime still `d84232f` at write time for prior docs-only tip).
- Video Gemini + device remain OWNER_GATE / BLOCKED.
