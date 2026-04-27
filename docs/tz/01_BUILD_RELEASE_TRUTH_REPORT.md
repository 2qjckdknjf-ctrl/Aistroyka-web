# Phase 1 — Build / Release Truth (отчёт)

**Проект:** AISTROYKA.AI  
**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 1 и §8 (gates).  
**Корень команд:** `/Users/alex/Projects/AISTROYKA` (или эквивалентный корень клонирования).

---

## A. Статус фазы

| Поле | Значение |
|------|----------|
| **Статус** | **PARTIAL** |
| **Следующая фаза разрешена** | **YES** (для Phase 2 по API/контрактам — см. оговорки ниже) |

**Обоснование PARTIAL:** автоматизированные **lint**, **unit/integration (Vitest)**, **production + OpenNext bundle (`cf:build`)** на машине проверки прошли успешно. Локальные скрипты **release readiness** и **validate-release-env** дали **FAIL** из‑за отсутствия секретов в окружении агента (`SUPABASE_SERVICE_ROLE_KEY`, в отчёте также `NODE_ENV` для полного прогона) — это **ожидаемо** для песочницы без полного `.env`, но для буквального «все gate зелёные» ТЗ §8.1 нужен прогон на машине с полным **серверным** env или в CI.

---

## B. Что проверено (доказательства)

### B.1. Команды и результаты

| Шаг | Команда | Результат |
|-----|---------|-----------|
| Установка целостности | (зависимости уже в workspace; CI использует `bun install --frozen-lockfile`) | не переустанавливали в этом прогоне |
| Lint | `bun run lint` | **PASS** — `next lint`, без предупреждений и ошибок ESLint |
| Тесты + контракты | `bun run test` | **PASS** — сначала `packages/contracts` (`tsc`), затем `vitest run` в `apps/web`: **236** файлов тестов, **1302** теста, длительность порядка **100 с** |
| Production + CF bundle | `bun run cf:build` | **PASS** (только при запуске **вне песочницы** с доступом к `~/.wrangler`) — Next.js **15.5.12**, OpenNext **1.16.6**, артефакт `.open-next/worker.js`, патчи middleware применены |
| Повтор `cf:build` в sandbox | то же | **FAIL** — `EPERM` на запись в `~/Library/Preferences/.wrangler/...` — **ограничение среды**, не кодовая ошибка |
| Синтаксис smoke-скриптов | `bash -n` на `scripts/smoke/pilot_launch.sh`, `apps/web/scripts/smoke-staging.sh`, `apps/web/scripts/smoke-prod.sh` | **PASS** |
| Release readiness | `node scripts/release-readiness-check.mjs` | **FAIL** — 1 failure: `env_SUPABASE_SERVICE_ROLE_KEY` **missing**; 4 WARN (storage checklist, Stripe, AI, push optional) |
| Env validation | `node scripts/validate-release-env.mjs` | **FAIL** — отчёт в `reports/release-hardening/env-validation-report.md`: среди критичных отмечены `NODE_ENV`, `SUPABASE_SERVICE_ROLE_KEY` (локальный снимок env) |

### B.2. Репозиторные факты (не команды)

- **PR CI** (`.github/workflows/ci-check.yml`): `bun install --frozen-lockfile`, `lint`, `test`, `cf:build` — совпадает с выполненным набором (кроме того, что локальный `cf:build` требует не-sandbox для wrangler).
- Отдельного npm-скрипта **`typecheck`** в `apps/web/package.json` нет; типизация входит в **`next build`** внутри цепочки `cf:build`.
- Миграции: каталог `apps/web/supabase/migrations/` (полный **apply** к целевой БД в этом прогоне **не выполнялся** — операторский шаг).

---

## C. Что изменилось

| Область | Изменения |
|---------|-----------|
| Код | **Нет** — только проверки и добавление данного отчёта |
| База данных | **Нет** |
| Документация | Добавлен файл **`docs/tz/01_BUILD_RELEASE_TRUTH_REPORT.md`** |

---

## D. Валидация (сводка)

| Проверка | Статус |
|----------|--------|
| tests (`bun run test`) | **PASS** |
| lint | **PASS** |
| typecheck как отдельная команда | **N/A** (не объявлена; покрыто `next build`) |
| contracts build | **PASS** (входит в `bun run test` / `cf:build` цепочку) |
| production / OpenNext build | **PASS** (см. B.1, вне sandbox) |
| `release-readiness-check` | **FAIL** (локальный env) |
| `validate-release-env` | **FAIL** (локальный env) |
| smoke (исполнение против URL) | **NEEDS_LIVE_VERIFICATION** — не запускались в этом прогоне |
| CI на PR | **NEEDS_VERIFICATION** в чужом PR — локально повторён эквивалентный набор lint/test/cf:build |

---

## E. Оставшиеся разрывы

| Приоритет | Описание |
|-----------|----------|
| **P0** | Нет для **сборки кода** после успешного `cf:build` вне sandbox. |
| **P1** | Полный **env gate** на рабочей машине релиза: `SUPABASE_SERVICE_ROLE_KEY`, прочие секреты; прогон `release-readiness-check` до **PASS** или **PASS_WITH_WARNINGS** по политике продукта. |
| **P1** | **Миграции:** подтверждение применения к target Supabase (не автоматизировано в `ci-check`). |
| **P2** | Предупреждение Next: `next lint` deprecated в пользу ESLint CLI — планировать миграцию. |
| **P2** | OpenNext: `WARN Skipping Next.js build` — ожидаемо при флаге `--skipNextBuild` после уже выполненного `next build`. |

**Внешние блокеры:** секреты и облачные учётные данные не доступны в среде агента; отчёты пишутся в `reports/release-hardening/`.

---

## F. Созданные / обновлённые файлы

| Путь | Действие |
|------|----------|
| `docs/tz/01_BUILD_RELEASE_TRUTH_REPORT.md` | **Создан** |
| `reports/release-hardening/release-readiness-check.md` | Обновлён скриптом `release-readiness-check.mjs` |
| `reports/release-hardening/env-validation-report.md` (+ `.json`) | Обновлены скриптом `validate-release-env.mjs` |

---

## G.1. Цепочка отчётов Phase 2–8

После Phase 1 добавлены: [02](./02_API_CONTRACT_HARDENING_REPORT.md) … [08](./08_ENTERPRISE_OPERATIONS_REPORT.md) и [индекс](./README.md).

## G. Рекомендация по следующему шагу

| Действие | Рекомендация |
|----------|--------------|
| **Продолжать** | **YES** — кодовая база в проверенной конфигурации **собирается и тестируется**. |
| **Остановиться** | Нет, если цель — только подтвердить build/test/cf на чистой машине с полным env: сначала выровнять env, повторить `release-readiness-check` и при необходимости `validate-release-env`. |
| **Следующий workstream по ТЗ** | **Phase 2 — API Contract Hardening** (`docs/tz/02_API_CONTRACT_HARDENING_REPORT.md` после инвентаризации и правок), параллельно при желании (опционально) явный скрипт `typecheck` в `apps/web/package.json` + шаг в CI для буквального соответствия §8.1. |

---

## Формат итога по шаблону ТЗ §12 (кратко)

- **PHASE STATUS:** PARTIAL  
- **NEXT PHASE ALLOWED:** YES (с оговоркой по полному env-gate на релизной машине)  
- **VERIFIED:** lint PASS; tests PASS (1302); cf:build PASS (вне sandbox); smoke scripts `bash -n` OK  
- **NOT VERIFIED IN THIS RUN:** post-deploy smoke к staging/prod; применение миграций к живой БД  
- **EXACT NEXT:** Phase 2 отчёт и инвентарь `/api/v1` + унификация envelope/валидации по плану ТЗ
