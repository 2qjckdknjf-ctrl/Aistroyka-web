# Closure A — §6C: персистенция лидов / контакта

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6C (`CLOSURE_A_CONTACT_PERSISTENCE.md`).  
**Согласованность:** [`CLOSURE_A_CONTACT_VALIDATION.md`](CLOSURE_A_CONTACT_VALIDATION.md).

## 1. Где хранится

- **Таблица:** `contact_leads` (Supabase / Postgres).
- **Миграции:** `20260307000000_contact_leads.sql`, `20260319000000_contact_leads_status_source_notes.sql` в `apps/web/supabase/migrations/`.
- **RLS:** включён; политики для anon/authenticated отсутствуют — запись с публичного API через **service role** в серверном маршруте (`getAdminClient()` и т.п., см. код `app/api/contact/route.ts`).

## 2. Что пишется при отправке формы

- Поля из контракта формы после валидации.
- **`source`:** `contact_form` (или актуальное значение в коде на момент коммита).
- **`status`:** `new` (стартовый статус жизненного цикла лида).

## 3. Как обрабатывается оператором

- Чтение списка: API под `api/v1/admin/leads` после проверок tenant + admin.
- UI: `admin/leads` (см. `CLOSURE_A_CONTACT_FLOW_AUDIT.md`).

## 4. Окружение

- Требуются корректные секреты/service role для записи из `POST /api/contact` — перечень переменных: `docs/ENVIRONMENT-VARIABLES.md` (не дублировать здесь, чтобы не разъехалось с кодом).

## 5. Границы документа

- Этот файл **не** подтверждает live-деплой миграций; только контракт репозитория. Live — Phase 3 / release-доки.
