# Phase 5 — Budget / Costs live activation (отчёт)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 5 и §6.12.

---

## A. Статус фазы

| Поле | Значение |
|------|----------|
| **Статус** | **OPEN** (код) + **NEEDS_LIVE_VERIFICATION** (БД и UI на target) |
| **Следующая фаза разрешена** | **YES** для **Phase 6 как кодовой** работы; **NO** для заявления «costs live» без операторской проверки |

---

## B. Что есть в репозитории

| Элемент | Путь / примечание |
|---------|-------------------|
| API costs | `app/api/v1/projects/[id]/costs/**`, `costs/[costItemId]/**` |
| Домен | `lib/domain/costs/*`, тесты `cost.service.test.ts`, `cost-signals.test.ts` |
| Миграции | в `apps/web/supabase/migrations/` — искать `project_cost_items` / cost (префиксы `20260307*`, `202603075*` и др.) |

---

## C. Что не сделано в этом прогоне

- Подключение к **реальному** Supabase-проекту и проверка `SELECT` / `INSERT` после apply миграций.
- Ручной проход manager UI «создать / изменить / удалить» cost item на staging.
- Появление сигналов давления бюджета в dashboard/intelligence на живых данных.

---

## D. Рекомендации для оператора

1. `supabase db push` / dashboard migrations — до состояния ветки `main`/`develop`.
2. Staging: создать тестовый cost item через UI и через API (`curl` + cookie или bearer).
3. Сверить ошибки «missing column» с последней миграцией.

---

## E. Шаблон ТЗ §12

- **PHASE STATUS:** OPEN / NEEDS_LIVE_VERIFICATION  
- **NEXT PHASE ALLOWED:** YES (код Phase 6), **costs «FULL» — NO** до live checklist
