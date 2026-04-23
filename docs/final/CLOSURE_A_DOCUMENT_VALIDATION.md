# Closure A — §6D: валидация (документы менеджера)

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6D (`CLOSURE_A_DOCUMENT_VALIDATION.md`).  
**Канон сценария:** [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md), ручной чеклист — [`CLOSURE_A_DOCUMENT_CHECKLIST.md`](CLOSURE_A_DOCUMENT_CHECKLIST.md).

## Автоматизированные проверки (repo)

| Область | Файлы тестов (пример) |
|---------|------------------------|
| Политика статусов / переходы | `apps/web/lib/domain/documents/document.policy.test.ts` |
| Репозиторий документов | `apps/web/lib/domain/documents/document.repository.test.ts` |

Полный зелёный прогон монорепо: [`CLOSURE_A_VALIDATION_REPORT.md`](CLOSURE_A_VALIDATION_REPORT.md) (lint / Vitest / production build на зафиксированном `HEAD`).

## Что не покрыто автотестами в объёме этого документа

- Браузерный E2E «клики в UI → реальная БД/Storage».
- Смоук целевой среды после деплоя.

## Фокус §6E для документов

Выполнить сценарии чеклиста на **staging** или **production** и приложить результат к тикету спринта (среда, дата, ID сущностей или скриншоты).
