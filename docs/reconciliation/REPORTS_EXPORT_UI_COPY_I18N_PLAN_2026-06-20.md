# Reports Export UI Copy / i18n Plan — 2026-06-20

## Preferred Labels
- Button label: existing `dashboardDetail.exportCsv`
- aria-label: new key if needed, e.g. `dashboardDetail.exportProjectReportsCsv`
- Loading text: not needed if using simple download link.
- Error text: not needed for first link-only slice; browser handles route error.
- No-data behavior: button can remain visible because backend returns header-only CSV safely.

## Locale Plan
- en:
  - Existing `exportCsv`: `Export CSV`
  - Proposed aria if needed: `Export project reports CSV`
- ru:
  - Existing `exportCsv`: `Экспорт CSV`
  - Proposed aria if needed: `Экспорт CSV отчётов проекта`
- es:
  - Existing `exportCsv`: `Exportar CSV`
  - Proposed aria if needed: `Exportar CSV de informes del proyecto`
- it:
  - Existing `exportCsv`: `Esporta CSV`
  - Proposed aria if needed: `Esporta CSV report progetto`

## Message Structure
- Use existing `dashboardDetail` namespace for project detail/report panel labels.
- Add new labels in en/ru/es/it only if needed.
- Run `bun run i18n:check`.
