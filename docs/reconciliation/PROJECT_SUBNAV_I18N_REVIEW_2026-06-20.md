# Project Subnav i18n Review — 2026-06-20

## Labels Added
- `dashboardDetail.projectSubnavAria`
- `dashboardDetail.overview`

## Locales
- en:
  - `projectSubnavAria`: `Project navigation`
  - `overview`: `Overview`
- ru:
  - `projectSubnavAria`: `Навигация по проекту`
  - `overview`: `Обзор`
- es:
  - `projectSubnavAria`: `Navegación del proyecto`
  - `overview`: `Resumen`
- it:
  - `projectSubnavAria`: `Navigazione progetto`
  - `overview`: `Panoramica`

## Validation
- `bun run i18n:check`: PASS.

## Notes
- Existing `projectSections` remains English in some locales; this slice did not alter unrelated pre-existing strings.
