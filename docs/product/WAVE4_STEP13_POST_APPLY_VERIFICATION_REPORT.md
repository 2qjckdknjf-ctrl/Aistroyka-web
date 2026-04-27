# Wave 4 Step 13 — Post-apply verification report

**Дата:** 2026-04-01

## 1. Схема (выполнено)

| Проверка | Результат |
|----------|-----------|
| `to_regclass('public.project_defects')` | `project_defects` |
| `to_regclass('public.project_defect_events')` | `project_defect_events` |
| `to_regclass('public.project_stakeholder_discussions')` | `project_stakeholder_discussions` (после цепочки миграций) |
| Политики на `project_defects` | **3** (select, write internal, portal insert) |

Инструмент: Supabase MCP `execute_sql`.

## 2. HTTP / UI (не автоматизировано в этой сессии)

Проверки ниже требуют **живого деплоя приложения** и **сессии пользователя** (manager / stakeholder):

| Поток | Как проверить |
|-------|----------------|
| Manager defects | Dashboard проекта → вкладка **Punch list**; `GET /api/v1/projects/:id/defects` не должен отдавать 5xx из‑за отсутствия таблицы. |
| Stakeholder | `/dashboard/projects/:id/client/defects` и POST создания снижа. |
| Handover | `GET .../handover` — при открытых blocking defects блокер `blocking_punch_defects` в readiness (логика уже покрыта unit‑тестами). |

**Статус:** схема и RLS на стороне БД подтверждены; **браузерные смоуки** — рекомендованы оператору после деплоя к этой же БД.

## Уверенность

- **Высокая** для наличия таблиц и политик в целевом Supabase‑проекте, к которому подключён MCP.
- **Средняя** для end‑to‑end UI до тех пор, пока не прогнаны ручные смоуки на staging/production URL с той же БД.
