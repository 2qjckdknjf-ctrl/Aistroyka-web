# C04 parity — передача среза

13 октября 2026 года. Изолированная ветка feat/stage2a-calculation-parity-2026-10-13 от Draft PR #448 HEAD f45f875d72f6d120338c4783f29fc550ff86a113. Preflight CURRENT_BASELINE; исходная занятая папка, origin/main, hosted ресурсы и данные не изменены.

## Результат

Согласованы чистые модули exact-decimal, planar-area, quantity-engine и commercial с текущим C04 ObraPrecioAI. Добавлены reasons для частично известных material results, system_area guard, канонизация обхода, contract decimal/pack bounds, precision-safe legacy adapter и policy commercial.stage2a.v1. Прежняя логика смет/затрат не переключена на новую политику. Подробнее: [канонический документ](../roadmap/STAGE2A_C04_QUANTITY_ENGINE_2026-10-13.md).

## Проверки

- 74/74 targeted scenarios PASS (24 исходных, 17 quantity/legacy, 33 commercial).
- Полный lint, build contracts, TypeScript noEmit и diff check PASS.
- Первый полный unit запуск: 2865 PASS / 5 FAIL из-за x86_64 /usr/local/bin/python3, который Node arm64 не мог запустить (spawn error -86). Проблемные 22 deploy-workflow tests прошли после выбора native Xcode Python через PATH тестового процесса; source patch не требуется.
- Полный unit набор запускается на чистом commit с native Python и без provider/Supabase credentials. Локальное evidence размещается в игнорируемой evidence/stage2a-c04; SHA и окончательный результат фиксируются при передаче координатору/PR.

Dependencies установлены с frozen bun.lock; lock/version не изменены. Unit setup запрещает немокированный fetch; Python security-header fixtures используют только localhost. Нет DB/provider/CF deploy/store/runtime вызовов. Новый Next/CF build этим срезом не заявляется.

## Продолжение

Хранение и авторизованные adapters — A01/O01, Manager/Worker UI и quantity/price bindings — A02–A05/O02/O05. Independent C05 требует реальных размеченных данных и закрытой выборки; синтетические fixtures не заменяют её. Merge и публикация остаются отдельными действиями через защищённый путь.
