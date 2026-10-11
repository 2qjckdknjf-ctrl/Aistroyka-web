# Current Focus

Обновлено 2026-10-11. Source: свежий origin/main; каноническая папка AISTROYKA-main-clean. [STATUS](../../STATUS.md), [реестр](../tasks/ACTIVE_WORK_REGISTRY.csv), [сверка плана](../roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md).

Операционный DB хвост закрыт с явным разрешением владельца: intake + lifecycle, 4-arg RPC, private helpers и timestamp/FK corrections применены. #415/#416/#417 объединены через current-head non-author APPROVED + required check. Повторный API lifecycle и очистка точных синтетических строк PASS. staging и production HTTP 200, buildStamp.sha7 = 35fa334 (проверка 2026-10-11 09:58 UTC).

Следующее действие перед SQL: свежий migration metadata export → migration_receipts_preflight.py. Пять исходных файлов уже применены под четырьмя remote IDs. Не replay, не broad db push, не blind history repair. [Контракт](../ops/VERIFIED_DB_MIGRATION_RECEIPTS.md).

Все 75 старых open PR отражены в обновлённом реестре с разделёнными HEAD/merge SHA. #281/#289/#293 закрыты как включённые, ветки сохранены. Не restack уже реализованные Customer/Graph/Vision/intake/video/daily-log/ROMA/D1 срезы.

Следующая приоритетная работа: hard audit существующего AI/security контура и PR #200 (image auth / legacy worker call paths), затем полный portal/device сценарий и недостающий async scope extraction AIS-CLIENT-005A. Новых AI возможностей до verdict не добавлять. Manual intake CRUD доказан; live camera/voice 005B зависит от следующих стадий. Android D2 не стартовать до iOS readiness. Store/legal/billing technical gates не закрыты общей автономностью.

[Handoff](../handoff/2026-10-11-continuation-state.md). Пользователь разрешил этот операционный этап; секреты и приватные schema/env snapshots остаются только локально. Chrome для независимого ревью не нужен: действующий reviewer token доступен, идентичность/HEAD проверяются до каждого review.
