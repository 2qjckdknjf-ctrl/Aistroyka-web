# Changelog Since Last Audit Baseline

## Baseline SHA

**`e4efcfccf242b78d63b60d8c71f4f881c0888582`**

**Reasoning:** `docs/audit/` exists. `docs/audit/PROJECT_STATE.md` has no git history yet. Per audit rules, baseline = last commit touching **`docs/audit/E2E_AUDIT_REPORT.md`** → `e4efcfccf242b78d63b60d8c71f4f881c0888582` (`docs: update audit evidence and workspace memory`, 2026-04-26).

## `git log --oneline <baseline>..HEAD`

```
547b594f chore: localize shared UI component states
78a41710 chore: localize shared dashboard controls
```

## `git diff --name-only <baseline>..HEAD`

```
apps/web/components/DashboardShell.tsx
apps/web/components/Nav.tsx
apps/web/components/ai/AiErrorBanner.tsx
apps/web/components/ai/CopyRequestIdButton.tsx
apps/web/components/approvals/ReportApprovalCard.tsx
apps/web/components/cockpit/FilterBar.tsx
apps/web/components/intelligence/AlertFeed.tsx
apps/web/components/intelligence/CopilotSummaryPanel.tsx
apps/web/components/intelligence/EvidenceCoverageCard.tsx
apps/web/components/intelligence/ProjectHealthPanel.tsx
apps/web/components/intelligence/RecommendationList.tsx
apps/web/components/intelligence/ReportingDisciplineCard.tsx
apps/web/components/intelligence/RiskList.tsx
apps/web/components/intelligence/SummaryCard.tsx
apps/web/components/onboarding/OnboardingGate.tsx
apps/web/components/plan-fit/PlanBadge.tsx
apps/web/components/projects/StakeholderActivityBlock.tsx
apps/web/components/public/PublicHeader.tsx
apps/web/components/ui/Alert.tsx
apps/web/components/ui/Chip.tsx
apps/web/components/ui/DateRangePicker.tsx
apps/web/components/ui/Modal.tsx
apps/web/components/ui/TablePagination.tsx
apps/web/messages/en.json
apps/web/messages/es.json
apps/web/messages/it.json
apps/web/messages/ru.json
apps/web/src/features/admin/components/RangeFilter.tsx
apps/web/src/features/admin/components/RequestIdPill.tsx
```

## Changed subsystems (committed range)

| Subsystem | In range? | Notes |
|-----------|-----------|--------|
| Web UI / i18n | **Yes** | Shared components + `messages/*.json` |
| `apps/web/app/api/**` | **No** | No files in diff |
| `apps/web/app/**/(dashboard)/**` routes | **No** | No route/page files in diff |
| Sync engine / `lib/sync` | **No** | (this pilot adds `serverCursor` alias on 409 only after baseline) |
| Auth | **No** | |
| DB / Supabase migrations | **No** | |
| `android/`, `ios/` | **No** | |

## Migrations (`apps/web/supabase/migrations`)

**None** changed between baseline and `HEAD` in the committed diff.

## Risk flags (committed delta)

- **Low / localization:** string and shared-component churn; no API or schema migrations in this window.
- **Regression focus for E2E:** dashboard CTAs that depend on changed labels or intelligence panels; verify Playwright role-based selectors and any `data-testid="cta.*"` entries still resolve.

## Uncommitted workspace note

`git status` at audit start may show additional modified files not listed above; they are **not** part of `baseline..HEAD` until committed.

---

## План доработки (pilot audit) — статус

**Сделано в этой итерации**

- Отчёт `write_pilot_reports`: учёт шага `install`, ссылки на `bun_install.log`, `playwright-traces/`, явный `AUDIT_ARTIFACT_DIR` при вызове из `run-pilot-audit.sh`.
- После Playwright: копирование `PLAYWRIGHT_TEST_DIR` → `artifacts/<ts>/playwright-traces/`.
- `apps/web`: скрипт `e2e:pilot` для быстрого прогона трёх спек без полного `e2e`.
- `dashboard-button-audit`: список CTA через `loadActionableCtas()` из `_helpers/button-inventory`.
- `sync-contract`: единый путь `sync-contract.log`, заголовок в `beforeAll`, строка в `afterEach` по каждому тесту.
- GitHub Actions: **`.github/workflows/pilot-e2e-audit.yml`** — ручной запуск Playwright pilot на `PILOT_E2E_BASE_URL` + логин-секреты (см. комментарии в workflow).
- Post-deploy staging: **`.github/workflows/deploy-cloudflare-staging.yml`** вызывает тот же reusable workflow после `pilot-smoke` с `continue-on-error: true` и `with.locale: en`; список секретов — **`docs/ENVIRONMENT-VARIABLES.md`** (раздел GitHub Actions / pilot E2E).
- `DashboardShell`: литеральные `data-testid` для **admin push / admin jobs** (совместимо со статическим AST-инвентарём).

**Дальше (бэклог)**

- ~~Post-deploy `pilot-e2e-audit` после staging~~: см. выше (`workflow_call` + `workflow_dispatch`).
- По желанию: **`on: schedule`** для `pilot-e2e-audit` (ночной прогон против staging) — отдельно от деплоя.
- ~~Расширить инвентарь сайдбара~~: `generate_button_inventory.mjs` синтетически разворачивает `SIDEBAR_LINKS` / `ADMIN_LINKS` в стабильные `cta.dashboard.nav.*` (без дублирования JSX-литералов).
- Опционально: генератор инвентаря на `ts-morph` рядом с `generate_button_inventory.mjs`, без дублирования полей JSON.
- **Следующий шаг для зелёного `PROJECT_STATE` / артефактов:** скопировать **`.env.pilot.example` → `.env.pilot`**, заполнить **`E2E_EMAIL` / `E2E_PASSWORD`** (и при необходимости поля для `smoke:pilot`), затем с корня **`bun run audit:pilot`** (обновит `docs/audit/PROJECT_STATE.md`, `E2E_AUDIT_REPORT.md`, `docs/audit/artifacts/<ts>/`).
