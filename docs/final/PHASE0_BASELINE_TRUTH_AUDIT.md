# Phase 0 — Базовый аудит истины (Baseline Truth Audit)

**Проект:** AISTROYKA / Aistroyka  
**Дата среза:** 2026-03-23  
**Метод:** осмотр структуры репозитория, ключевых конфигов, выборочный поиск по коду, **один** полный прогон `npm run build` с корня монорепозитория.

---

## 1. Что проверено фактически

### 1.1 Структура монорепозитория

- **Приложение веб:** `apps/web` — Next.js 15 (App Router), локали `[locale]`, публичные и дашборд-маршруты, большой пласт `app/api` и `app/api/v1`.
- **Пакеты:** `packages/contracts`, `packages/contracts-openapi` (workspace в корневом `package.json`).
- **Мобильные:** `ios/` — `AiStroykaManager`, `AiStroykaWorker`, `Shared`, `Config`; `android/` — Gradle-проект с `shared`, два приложения по согласованной схеме.
- **Документация:** обширный каталог `docs/` (архитектура, продукт, отчёты); часть файлов в **незакоммиченном** состоянии по `git status` на момент аудита.
- **Paperclip:** каталог `paperclip/` — **вендорная копия** upstream Paperclip для локальной оркестрации агентов (см. корневой `README.md`); не входит в npm workspaces продукта.
- **Корневые артефакты:** присутствуют `middleware.ts`, `lib/`, `components/` у корня — потенциальный **дрейф** относительно основного приложения в `apps/web` (требует отдельной инвентаризации в Closure A).

### 1.2 Сборка (repo proof)

- Команда: `npm run build` из корня `/Users/alex/Projects/AISTROYKA`.
- Результат: **успех**, `exit_code: 0` (~118 с в последнем прогоне 2026-03-23). Next.js **15.5.12** сообщил **297** маршрутов в отчёте сборки, компиляция и проверка типов прошли без ошибки.

### 1.3 База данных и миграции

- Каталог: `apps/web/supabase/migrations/` — **62** SQL-файла миграций.
- Недавние темы по именам файлов: `contact_leads`, `project_documents`, `billing_readiness`, `plan_fit_persistence`, `project_issues`, `document_decision_fields`, `manager_notifications`, `project_members_owner_role` и др.
- Применение в целевых средах **в этом аудите не проверялось** (нет live-доступа из сессии) — состояние «применено в prod/staging» = **неизвестно**, только наличие файлов в репо.

### 1.4 Деплой и CI

- GitHub Actions: `deploy-cloudflare-prod.yml`, `deploy-cloudflare-staging.yml`, `apply-migrations.yml`, `pilot-smoke.yml`, `snapshot-backup.yml`, `update-lockfile-linux.yml`.
- Скрипты смоука в корне: `smoke:prod`, `smoke:staging`, `smoke:pilot`, `release:check`.
- **Истина по CI:** `deploy-cloudflare-prod.yml` описывает **production** как push в `main` → `bun install --frozen-lockfile` → `bun run cf:build` → deploy в **Cloudflare Workers** (OpenNext). Параллельно в `apps/web/vercel.json` заданы `installCommand` / `buildCommand` от корня монорепо для **Vercel** (см. также `AGENTS.md`: Root Directory `apps/web`). Итого: в репозитории задокументированы **оба** контура; **автоматический prod-пайплайн в GitHub — Cloudflare**. Согласовать с оператором, какой хостинг считается каноническим для `aistroyka.ai`, и не дублировать прод без осознанного решения.

### 1.5 Функциональные контуры (по структуре маршрутов и API)

- **Публично:** `(public)/contact`, pricing, marketing-страницы; API `apps/web/app/api/contact` (и v1 admin leads).
- **Менеджер:** `dashboard/*`, `projects`, `portfolio`, `team`, `billing`, `admin/*` включая `admin/leads`.
- **Worker API:** множество маршрутов `/api/v1/worker/*`, sync, tasks.
- **Документы и согласования:** `/api/v1/projects/[id]/documents/*`, `decision`, `approval-history`; UI approvals в дашборде.
- **Стоимость:** `/api/v1/projects/[id]/costs/*`, миграции `project_cost_items`.
- **AI / Copilot:** `/api/v1/projects/[id]/copilot`, `copilot/chat/stream`, тест `route.test.ts`; публичная страница `/copilot`.
- **Интеллект / внимание:** `attention`, `summary`, `timeline`, `intelligence`, `insights`, `portfolio/summary` — наличие в дереве сборки подтверждено.
- **Заказчик:** маршрут `dashboard/projects/[id]/owner` присутствует в выводе `next build`.

### 1.6 Лиды и контакт

- Миграции `contact_leads`, расширения `contact_leads_status_source_notes`.
- Админ UI: `/admin/leads`, API `api/v1/admin/leads`. Полный E2E от формы до БД **в этом аудите не гонялся** — гипотеза: персистенция заложена; **требуется** сценарная проверка в Closure A.

### 1.7 Автоматическая валидация (repo proof, обновление 2026-03-23)

| Проверка | Команда | Результат | Примечание |
|----------|---------|-----------|------------|
| ESLint | `npm run lint` (корень) | **PASS** | Через `npm run --prefix apps/web lint`; Next.js предупреждает, что `next lint` deprecated в пользу ESLint CLI в Next 16 |
| Vitest | `npm run test` (корень) | **PASS** | **1034** теста, **165** файлов; перед прогоном исправлены два дефекта тестов (импорт `beforeEach`, ожидание `build_sha` после `slice(0,7)`) |
| Release readiness | `npm run release:check` | **FAIL** | В среде прогона отсутствовали `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — отчёт: `reports/release-hardening/release-readiness-check.md`. Для **production gate** проверку нужно выполнять с заполненным env (CI/секреты), иначе FAIL ожидаем и не означает поломку кода. |

### 1.8 Частичная инвентаризация дрейфа `lib/` (пункт §1 плана, не полный diff)

- **`/lib` (корень):** 11 файлов — в основном обёртки Supabase (`supabase/*.ts`), `env.ts`, `storage.ts`, `rpc.ts`, `types.ts`, `app-url.ts`. Не совпадает по объёму с `apps/web/lib` (сотни модулей).
- **`apps/web/lib`:** канонический код приложения (`domain`, `platform`, `tenant`, и т.д.); импорты в коде идут через `@/lib/...` относительно `apps/web`.
- **Вывод Phase 0:** корневой `lib/` выглядит как **legacy / вспомогательный слой**; полная таблица дублей имён и ссылок — в Closure A (`CLOSURE_A_ARCH_DRIFT_INVENTORY.md` или эквивалент).

---

## 2. Что не проверено (явные пробелы аудита)

- **E2E Playwright** (`apps/web` scripts `e2e`).
- **Сборка iOS/Android** и ручные сценарии на устройствах.
- **Live/staging/prod:** фактическое состояние схемы Supabase, секретов, Stripe, пушей — см. структурированную baseline-матрицу в [`PHASE0_RUNTIME_LIVE_MATRIX.md`](PHASE0_RUNTIME_LIVE_MATRIX.md) (что из репо vs что только из среды).
- Содержательный обзор **каждого** из 62 миграций (только инвентаризация по списку и темам имён).
- Полный обзор дублирования **корневого** `lib/` и `apps/web/lib`.

---

## 3. Наблюдения о рисках (гипотезы → проверить)

1. **Дрейф структуры:** корневые `lib/`, `components/`, `middleware.ts` рядом с полноценным `apps/web` — риск расхождения «канонического» кода и документации.
2. **Двойной контур деплоя:** Cloudflare-скрипты vs упоминание Vercel в процессах — риск путаницы целевой среды.
3. **Большой объём незакоммиченных изменений** (по snapshot git): риск несогласованности между документами «закрыто» и тем, что в main.
4. **Ширина surface area:** сотни маршрутов API — для MVP критично сузить **обязательный** набор смоук-сценариев.
5. **Корневые npm-скрипты и Bun:** ранее `lint`/`test` в корневом `package.json` вызывали `bun`; на машине без Bun команды падали. Исправлено на вызов через `npm run --prefix apps/web` — CI и разработчики без Bun получают стабильный путь (**зафиксировано в коде 2026-03-23**).

---

## 4. Вывод Phase 0 (промежуточный)

| Вопрос | Ответ |
|--------|--------|
| Репозиторий собирается (web)? | **Да** — один успешный `npm run build` 2026-03-23. |
| Lint / unit-тесты (web)? | **Да** — `npm run lint` и `npm run test` с корня 2026-03-23. |
| `release:check` в пустой env? | **FAIL** по обязательным Supabase переменным — норма для локали без `.env`; для релизного gate нужен заполненный контур. |
| Миграции присутствуют? | **Да** — 62 файла в `apps/web/supabase/migrations`. |
| Live/runtime parity доказана? | **Нет** — не проверялась. |
| Мобильные приложения проверены? | **Нет** — только структура каталогов. |
| Продуктовая полнота MVP? | **Не оценена** — требуется матрица сценариев в Phase 1–8. |

**Вердикт Phase 0 (документ «базовая линия»):** базовая картина репозитория зафиксирована; **lint + vitest закрыты как repo proof**; остаются Playwright, mobile, live и пункты §1 `PHASE0_EXECUTION_PLAN` (дрейф, contact E2E, deploy truth).

**Вердикт Phase 0 (строго полная фаза по всем чеклистам):** **NO** — пока не выполнены пункты 4–6 плана исполнения и нет live-доказательств.

Следующий шаг: выполнить оставшиеся строки чеклиста в `PHASE0_EXECUTION_PLAN.md` §1, затем переходить к Closure Sprint A только при отсутствии открытых P0 по релизной дисциплине и безопасности.
