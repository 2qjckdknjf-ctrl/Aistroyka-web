# Closure A — контакт/лиды (P0-04)

**Дата:** 2026-03-23  
**Связь:** `docs/final/PHASE0_MASTER_BACKLOG.md` (P0-04: потеря лидов)  
**Имена §6C AGENTS.md:** тот же материал разбит для формального комплекта — [`CLOSURE_A_CONTACT_FLOW_AUDIT.md`](CLOSURE_A_CONTACT_FLOW_AUDIT.md), [`CLOSURE_A_CONTACT_PERSISTENCE.md`](CLOSURE_A_CONTACT_PERSISTENCE.md), [`CLOSURE_A_CONTACT_POST_AUDIT.md`](CLOSURE_A_CONTACT_POST_AUDIT.md). Этот файл остаётся **сводной технической валидацией** (код + тесты).

## Цепочка E2E (код)

1. **Публичная страница:** `apps/web/app/[locale]/(public)/contact/` — `ContactForm` шлёт `POST /api/contact` с JSON `{ name, email, company?, message }`.
2. **Персистенция:** `apps/web/app/api/contact/route.ts` — валидация Zod, `getAdminClient()`, вставка в `contact_leads` с `source: "contact_form"`, `status: "new"`.
3. **БД:** миграции `20260307000000_contact_leads.sql`, `20260319000000_contact_leads_status_source_notes.sql` — таблица `contact_leads`, RLS включён без политик (доступ только через service role с API).
4. **Оператор:** `apps/web/app/api/v1/admin/leads/route.ts` — после `requireTenant` + `requireAdmin(..., "read")` список лидов; UI `apps/web/app/[locale]/(dashboard)/admin/leads/` и ссылка с `admin/page.tsx`.

## Доказательства

- **Автотесты (локально):** `npx vitest run app/api/contact/route.test.ts app/api/v1/admin/leads/route.test.ts` — 10 тестов, зелёные.
- **Публичный API:** маршрут `/api/contact` не попадает под matcher middleware (исключение `api` в первом шаблоне; `/api/v1/*` обрабатывается отдельно), форма доступна без сессии.

## OPEN (не блокирует закрытие по коду)

- Нет отдельного Playwright/Cypress сценария «форма в браузере → запись в БД → список в админке»; для прод-смоука остаётся ручной прогон или добавление E2E.
- В целевой среде должны быть применены миграции и настроен service role для маршрута контакта (см. `docs/ENVIRONMENT-VARIABLES.md`).

## Вердикт

Реализация цепочки «форма → БД → admin/leads» в монорепо согласована; регрессии по контракту API покрыты unit-тестами. Полный браузерный E2E и прод-смоук — вне объёма этого артефакта.
