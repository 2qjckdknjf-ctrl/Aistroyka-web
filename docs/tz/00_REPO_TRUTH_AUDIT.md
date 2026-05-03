# Аудит истины репозитория (Phase 0)

**Проект:** AISTROYKA.AI  
**Дата:** 2026-04-27  
**Основание:** техническое задание `AISTROYKA_TZ.md` v1.0, раздел 10 (Phase 0 — Repo Truth Audit).  
**Правило:** факты из репозитория; там, где нужен runtime/staging/prod — помечено как **NEEDS_LIVE_VERIFICATION**.

---

## 1. Назначение документа

Зафиксировать **фактическое** состояние монорепозитория до масштабных доработок: структура, основные поверхности, CI/CD, миграции, расхождения с устаревшими документами и с внешними программами (например, launch lock для первого клиента).

Связанные артефакты Phase 0:

- `docs/tz/00_MODULE_STATUS_MATRIX.md` — матрица модулей.
- `docs/tz/00_OPEN_BLOCKERS.md` — открытые блокеры и риски.

---

## 2. Монорепозиторий и инструменты

| Элемент | Факт |
|---------|------|
| Корень | `package.json`, workspaces: `apps/web`, `packages/contracts` |
| Менеджер пакетов | `bun@1.2.15` (закреплено в корневом `package.json`) |
| Сборка веба | `bun run build` → контракты + `next build` в `apps/web` |
| Cloudflare / OpenNext | `bun run cf:build`, конфиги в `apps/web/wrangler.toml` и связанных файлах |
| Контракты API | `packages/contracts`, сборка в цепочке `build` / `cf:build` |

---

## 3. Веб-приложение (`apps/web`)

| Элемент | Факт |
|---------|------|
| Фреймворк | Next.js (App Router), локализованные маршруты `app/[locale]/…` |
| Публичный сайт | Сегменты вроде `(public)` под `[locale]` |
| Кабинет | `(dashboard)` — операционный веб-контур |
| Кабинет владельца платформы | `(owner)` — отдельная зона; доступ через гранты `platform_owner_*` (middleware + layout) |
| API | Канонический префикс **`/api/v1/*`**; подсчёт на дату аудита: **~197** файлов `route.ts` только в дереве `app/api/v1` (плюс тесты рядом) |
| Конфигурация | Канонический слой **`apps/web/lib/config/`** (`index.ts`, `public`, `server`, `debug`, `release-env`, тесты); в коде зафиксированы правила использования `process.env` |
| Дизайн-токены | `apps/web/lib/design/` — `colors`, `spacing`, `typography`, `shadows`, `radius`, `design-tokens`, `index` |
| Бренд в `public` | `apps/web/public/brand/` — в основном **SVG** (логотип, иконка и др.); в ТЗ перечислены `.png` — **частичное** совпадение имён/форматов с буквальным списком ТЗ |

---

## 4. База данных и миграции

| Элемент | Факт |
|---------|------|
| Каталог миграций | **`apps/web/supabase/migrations/`** — на дату аудита **~98** SQL-файлов |
| Примечание | В старых документах (например, `docs/status/TECHNICAL_DOSSIER.md`) могут указываться пути вида `engine/Aistroyk/supabase/` — для операций и аудита **источник истины — `apps/web/supabase/migrations/`** |
| Содержание миграций | Tenant/RLS, отчёты, медиа, push, billing pilot, stakeholder/client-портал, platform owner grants/audit, AI-таблицы и др. |

Применение миграций к целевому Supabase — **операторский шаг**; в CI merge-gate полного «apply к prod» нет (см. матрицу и блокеры).

---

## 5. Мобильные клиенты

### 5.1. iOS

| Элемент | Факт |
|---------|------|
| Структура | Приложения `ios/AiStroykaWorker`, `ios/AiStroykaManager`, общий код в `ios/Shared` |
| Xcode-проект | В рабочем дереве репозитория **не обнаружено** `*.xcodeproj` (поиск по workspace) — **релиз-инженерия / воспроизводимость** для требования ТЗ про `xcodebuild` требует уточнения (отдельный репозиторий, gitignore, или артефакт вне снимка) |
| Контуры | Worker: отчёт, медиа, sync — по коду и внутренним отчётам **основной продуктовый контур**; Manager — шире, с частью placeholder-экранов |

### 5.2. Android

| Элемент | Факт |
|---------|------|
| Модули | `android/AiStroykaWorker`, `android/AiStroykaManager`, `android/shared` |
| Shared | `AuthService`, `WorkerApi`, `ManagerApi`, `ApiClient`, DTO, тесты (например, submit body) |
| Manager UI | `ManagerApp.kt` — **реальные** экраны: логин, дом, список отчётов, деталь, выход |
| Worker UI | `WorkerApp.kt` — **заглушка** (один `Text`); при этом `WorkerViewModel` содержит логин, проекты, задачи, фото, submit — **логика не подключена к UI** |
| CI | `.github/workflows/android-instrumented-smoke.yml` — **только `workflow_dispatch`**, не gate на каждый PR |

**Сопоставление с ТЗ v1.0 §6.4:** ТЗ допускает foundation и запрет parity до отдельного milestone — **в целом согласуется**, но формулировка «нет auth/API» для Android **устарела**: shared-слой и Manager **богаче**, чем «пустая оболочка»; Worker **остаётся слабым в UX-слое**.

**Конфликт с `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md`:** там Android для первого клиента **обязателен** как продукт — это **противоречие приоритетов** с ТЗ v1.0; требуется продуктовое решение, какой документ главнее для конкретной поставки.

---

## 6. GitHub Actions и релизная дисциплина

| Workflow | Назначение (кратко) |
|----------|-------------------|
| `ci-check.yml` (PR → main/master) | `bun install --frozen-lockfile`, `lint`, `test`, `cf:build` |
| `deploy-cloudflare-staging.yml` | Push/develop или dispatch: проверка env, `cf:build`, деплой staging, **блокирующий** post-deploy `pilot-smoke` через reusable workflow |
| `deploy-cloudflare-prod.yml` | Прод-деплой (отдельно смотреть шаги smoke) |
| `pilot-smoke.yml`, `pilot-e2e-audit.yml` | Смоки / Playwright пилот |
| `android-instrumented-smoke.yml` | Ручной запуск instrumented для Worker |
| `ai-phase5-slo-schedule.yml` | По имени — вспомогательный контур AI/SLO (детали — в файле) |

Отдельного скрипта **`typecheck`** в `apps/web/package.json` нет; типовая проверка идёт в составе **`next build`** (входит в `cf:build`). Для буквального соответствия таблице gate в ТЗ §8.1 можно добавить явный `tsc --noEmit` — **gap процесса**, не обязательно gap качества.

---

## 7. Документация vs код

| Тема | Замечание |
|------|-----------|
| `docs/status/TECHNICAL_DOSSIER.md` | Устаревшие пути к миграциям и engine — **STALE_DOCS** относительно текущего дерева |
| `docs/launch/FIRST_CLIENT_*` | Актуальны для программы «первый клиент», но **конфликтуют** с ТЗ v1.0 по Android |
| ТЗ требует `docs/tz/00_*` | До 2026-04-27 **отсутствовали** — данный набор файлов **закрывает** этот пробел |

---

## 8. Команды проверки (зафиксированы при аудите)

Выполнялись в среде аудита (без деплоя, без полного E2E):

```bash
# из корня репозитория
find apps/web/app/api/v1 -name 'route.ts' | wc -l
find apps/web/supabase/migrations -name '*.sql' | wc -l
```

Результаты на дату документа: **~197** маршрутов v1, **~98** миграций.

Полный прогон **`bun run test`**, **`bun run cf:build`** в рамках создания этого файла **не обязателен** для «описательного» Phase 0; для Phase 1 по ТЗ — **обязателен** с фиксацией в `docs/tz/01_BUILD_RELEASE_TRUTH_REPORT.md`.

---

## 9. Вывод Phase 0 (Repo Truth)

Репозиторий — **зрелое web/API ядро** с большим покрытием домена строительного управления, миграциями под Supabase, Cloudflare-пайплайном и блокирующим staging-smoke после деплоя. **Мобильный контур асимметричен**: iOS — основной; Android — shared/Manager продвинуты, **Worker UI не связан с ViewModel**. **Platform Owner** — периметр доступа и API есть, **продуктовый кабинет** из ТЗ §5.1 не завершён. **Артефакты `docs/tz/`** до этой даты отсутствовали — **созданы**.

**Статус Phase 0 (документирование истины):** **PARTIAL** — истина зафиксирована в трёх файлах; live-проверки staging/prod и полный iOS/Android runtime **вынесены** в последующие фазы и колонку NEEDS_LIVE_VERIFICATION в матрице.

**Переход к Phase 1 (Build/Release Truth) по ТЗ:** выполнен прогон и зафиксирован отчёт **`docs/tz/01_BUILD_RELEASE_TRUTH_REPORT.md`** (lint/test/cf:build PASS; локальные env-gate скрипты — PARTIAL из‑за отсутствия серверных секретов в среде прогона).
