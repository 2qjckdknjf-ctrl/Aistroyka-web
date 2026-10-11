# Current Focus

Обновлено 2026-10-11. Текущий исходный код: origin/main; рабочий статус: [STATUS](../../STATUS.md).

#385/#386 и Customer intake #404/#405/#406 уже объединены. #411 stakeholder tenant resolution объединён в `813c6ae3` после non-author APPROVED и успешных web/iOS CI. Не повторять эти реализации.

Следующий этап: staging verification после #411 и подготовка существующих RPC/intake миграций. Live apply остаётся OWNER_GATE; отдельная целевая staging БД должна быть подтверждена до записи. На read-only проверке AISTROYKA RPC всё ещё 3-arg, customer_intake_drafts отсутствует.

Тесты этой сессии: 30 portal route/resolver + 71 customer-intake domain PASS. macOS swift test Shared не поддерживает UIKit; iOS simulator CI #411 SUCCESS. Runtime health перед публикацией #411: staging/production HTTP 200, SHA `3adcabf`.

[Handoff](../handoff/2026-10-11-intake-queue-verification.md). Дальнейшие задачи выбираются по зависимостям плана и актуальному реестру; D2/005B не запускать в обход существующих решений.
