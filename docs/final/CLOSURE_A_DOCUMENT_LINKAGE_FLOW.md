# Closure A — §6D: связи документа (проект, веха, отчёт, задача)

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6D (`CLOSURE_A_DOCUMENT_LINKAGE_FLOW.md`).  
**Канон:** [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md), [`CLOSURE_A_DOCUMENT_CHECKLIST.md`](CLOSURE_A_DOCUMENT_CHECKLIST.md).

## Назначение

Фиксация **обязательной** связи с проектом и **опциональных** связей с вехой, отчётом, задачей.

## Repo-proof

- Все записи `project_documents` с `project_id` — E2E §3.
- UI: колонка «Связь» — `milestone_id`, `report_id`, `task_id` и навигация на `/dashboard/reports/...`, `/dashboard/tasks/...` — E2E §3.

## Проверка на стенде

Чеклист «Регресс связей» — [`CLOSURE_A_DOCUMENT_CHECKLIST.md`](CLOSURE_A_DOCUMENT_CHECKLIST.md).

## OPEN

Наличие реальных данных для отчёта/задачи в тестовом проекте — условие для полного UX-доказательства.
