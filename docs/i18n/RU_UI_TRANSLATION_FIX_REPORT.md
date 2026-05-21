# RU dashboard UI — translation fix report

Date: 2026-05-12  
Scope: `apps/web` — onboarding / activation banners, operations KPI cards, message bundles, validation tooling.

## Root cause

1. **Hardcoded English** in client components `GetStartedPanel.tsx` and `FirstValueBanner.tsx` bypassed `next-intl`, so the Russian dashboard showed fixed English strings regardless of locale.

2. **Unstable React list keys for KPI cards**: `DashboardOpsOverviewClient` used `key={label}` where `label` was the **translated** caption. When two KPI labels matched in Russian (e.g. overlapping wording for “open tasks today”), React reused DOM nodes incorrectly and could surface confusing UI or fallback-looking labels. Keys are now stable message ids (`labelKey`), not rendered text.

3. **Legacy English copy inside `ru.json`**: Several `projectDetail` and `health` entries were still English strings (visible on project surfaces). These were translated to Russian without changing keys or layout.

4. **Locale tree drift**: Full leaf-key parity between `en.json` and `ru/es/it.json` is not restored repo-wide (many namespaces differ). The new checker focuses on **`activation.*` and `dashboard.*`** where dashboard onboarding and ops KPIs live; optional `I18N_CHECK_ALL=1` runs a full-tree audit for future cleanup.

## Files changed

| Area | File |
|------|------|
| Onboarding | `apps/web/components/onboarding/GetStartedPanel.tsx` |
| First-value banner | `apps/web/components/onboarding/FirstValueBanner.tsx` |
| Ops KPI grid | `apps/web/app/[locale]/(dashboard)/dashboard/DashboardOpsOverviewClient.tsx` |
| Messages | `apps/web/messages/en.json`, `ru.json`, `es.json`, `it.json` |
| i18n script | `scripts/i18n/check-messages.js` |
| Scripts | `apps/web/package.json` (`i18n:check`), root `package.json` (`i18n:check`) |
| CI | `.github/workflows/ci-check.yml` (runs `bun run i18n:check`) |

## Strings moved to translations (`activation` namespace)

New namespace **`activation`** (all four locales):

- `getStartedTitle`
- `createProject`, `inviteTeam`, `addFirstTask`, `uploadFirstReport`, `viewAiInsights`
- `firstReportSubmitted`, `openAiInsights`

Components now call `useTranslations("activation")` for these strings.

## Dashboard / KPI message updates

- **RU** (`dashboard`): Adjusted copy per product wording for task KPIs and queues (`kpiTasksCompletedToday`, `queueTasksOpenToday`, `queueOpenShiftNoReport`, `queueAiFailures`).
- **EN / ES / IT**: Aligned `queueOpenShiftNoReport` and `queueAiFailures` with clearer non-placeholder wording; EN `queueAiFailures` → “AI errors (24h)”.

## `projectDetail` / `health` (RU only)

Russian replacements for previously English values: executive/operations/advanced blocks, evidence/decision/AI health labels, and `health.*` score labels.

## Validation results

Commands run successfully after changes:

| Command | Result |
|---------|--------|
| `bun run i18n:check` (from `apps/web` or repo root) | Pass (scoped `activation` + `dashboard`) |
| `bun run lint` (`apps/web`) | Pass |
| `bunx tsc --noEmit` (`apps/web`) | Pass |
| `bun run test` (`apps/web`) | Pass |
| `bun run build` (repo root) | Pass |
| `bun run cf:build` (repo root, with `NEXT_PUBLIC_*` set for CI-style bake) | Pass |

## Remaining risks

1. **Full locale parity**: `I18N_CHECK_ALL=1 node scripts/i18n/check-messages.js` still reports large drift between `en.json` and other locales outside `activation` / `dashboard`. Screens that use namespaces only present in `en` may show English fallbacks or missing-key paths until those trees are merged and translated.

2. **Other hardcoded UI**: Demo/onboarding fixtures (e.g. `DemoProjectCard`) and some API/help payloads may still emit English; they were out of the screenshot-critical path but should be audited if shown to Russian users.

3. **`nav.ai` and hybrid labels**: Some navigation entries intentionally keep short labels (e.g. “AI”); review separately if product wants Cyrillic-only nav.

## Final acceptance (mission checklist)

- RU dashboard onboarding / first-report banner: uses `activation` translations — no hardcoded English in those components.
- Ops KPI row: React keys are stable; labels come from `dashboard.*` keys — no duplicate-key collisions from identical translated captions.
- `activation` + `dashboard` keys are synchronized across `en`, `ru`, `es`, `it` per `scripts/i18n/check-messages.js` default mode.
