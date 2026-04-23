# Closure A — §6C: аудит потока контакта / лида

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6C (`CLOSURE_A_CONTACT_FLOW_AUDIT.md`).  
**Согласованность:** фактический срез совпадает с [`CLOSURE_A_CONTACT_VALIDATION.md`](CLOSURE_A_CONTACT_VALIDATION.md); при расхождении приоритет у **более новой даты** и у **тестируемого кода**.

## 1. Поверхности

| Шаг | Компонент | Примечание |
|-----|-----------|------------|
| Публичный UI | `apps/web/app/[locale]/(public)/contact/` | `ContactForm`, поля согласно контракту API |
| Публичный API | `POST /api/contact` | `apps/web/app/api/contact/route.ts`, JSON `{ name, email, company?, message }` |
| Операторский UI | `/[locale]/admin/leads` | список после `requireTenant` + admin |
| Операторский API | `GET` (и связанные) под `apps/web/app/api/v1/admin/leads/` | см. тесты маршрута |

## 2. Исключения middleware / доступ

- Маршрут `/api/contact` не должен требовать сессии пользователя; детали матчера — в `CLOSURE_A_CONTACT_VALIDATION.md`.

## 3. Валидация и сбои

- Вход: Zod в `route.ts` контакта.
- Ошибки: без «тихого» успеха при сбое записи; поведение зафиксировано unit-тестами `app/api/contact/route.test.ts`.

## 4. OPEN (аудит уровня продукта, не код)

- Нет обязательного Playwright/Cypress «браузер → БД → админка» в этом наборе артефактов.
- Прод-смоук и применённые миграции в целевой среде — см. [`CLOSURE_A_CONTACT_POST_AUDIT.md`](CLOSURE_A_CONTACT_POST_AUDIT.md).
