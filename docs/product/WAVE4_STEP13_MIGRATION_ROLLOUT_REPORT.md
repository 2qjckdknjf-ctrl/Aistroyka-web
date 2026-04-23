# Wave 4 Step 13 — Migration rollout report

**Target migration:** `apps/web/supabase/migrations/20260404120000_project_defects.sql`

## What blocked local `npm run db:migrate`

- Подключение с машины разработчика к Postgres давало **`ETIMEDOUT`** (сеть / allowlist / pooler).
- Даже при наличии URI удалённая БД **отставала от репозитория**: не было таблицы `project_stakeholder_discussions`, поэтому одна только миграция defects падала с `42P01`.

## Фактическое применение (2026-04-01)

**Канал:** Supabase MCP сервер **`user-supabase`**, инструмент **`apply_migration`** (DDL через управляемый API проекта).

**Порядок (зависимости перед defects):**

1. `20260329170000_stakeholder_notifications.sql` — **success**
2. `20260401140000_stakeholder_discussions.sql` — **success**
3. `20260401150000_stakeholder_discussion_portal_status_rpc.sql` — **success**
4. `20260402120000_project_change_orders.sql` — **success**
5. `20260403100000_project_handover.sql` — **success**
6. `20260404120000_project_defects.sql` — **success**

В **`supabase_migrations`** появились версии (пример): `20260401132243` → `20260404120000_project_defects` и соседние записи для шагов выше.

## Проверка после apply

- `to_regclass('public.project_defects')` → **`project_defects`**
- `to_regclass('public.project_defect_events')` → **`project_defect_events`**
- RLS: на `project_defects` зарегистрировано **3** политики (`pg_policies`).

## Альтернатива для будущих релизов

- GitHub Actions **Apply Supabase migrations** (`.github/workflows/apply-migrations.yml`) — когда секреты и сеть CI доступны к тому же проекту.
