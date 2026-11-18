# AISTROYKA — панель проекта

Обновлено 2026-10-11. [START_HERE](START_HERE.md), [STATUS](STATUS.md), [актуальная сверка плана](docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md).

| Очередь | Реальное состояние | Продолжить существующее |
|---|---|---|
| V2 аудит → план, 2026-10-20 | [Draft PR #453](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/453); 97 subordinate packages PROPOSED; 73 findings, 406 AC, 243 future checks; source baseline 04ec74b | [Единая интеграция](docs/roadmap/AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md); Phase/AIS сохранены, Android deferred; one scoped acceptance gap после fresh PR check |
| Customer iOS | Target/auth/list/detail/intake код в main | Полный portal + physical device smoke; store readiness отдельно |
| Construction Graph | Код persistence и live schema есть | Live lineage/review сценарий ещё нужно доказать |
| Vision | Async/request_key в main; 4-arg RPC применён | Полный upload → job → result сценарий; не переписывать RPC |
| Intake | CRUD/edit/submit/withdraw в main и live БД; API цикл PASS | Hard audit и недостающий AI scope extraction, без новых договоров/смет по AI |
| Безопасность БД | Private intake helpers, lifecycle guard, timestamp/FK corrections применены | Исторические advisors — отдельная semantic review |
| Deploy | Гонка provider-secret исправлена #417; source stamp из checkout | Health/workflow proof staging и production HTTP 200, buildStamp.sha7 = 35fa334 (проверка 2026-10-11 09:58 UTC) |
| Старые PR | 75 открытых, все в реестре; дополнительные дубли #281/#289/#293 закрыты | Сверять конкретный diff/требование, не объединять старые стеки целиком |

В реестре head_sha означает HEAD PR, merge_sha — коммит, вошедший в main. Перед действием обновить GitHub; состояние MERGED не доказывает DB/mobile/runtime readiness само по себе.

Рабочая точка — AISTROYKA-main-clean. Старая первичная папка, protected/mobile/design/AI/Cursor worktrees и приватные снимки сохранены. Никакие dirty источники не сбрасывались. [Receipts](docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md) предотвращают повторный SQL apply; полная историческая сверка миграций ещё отдельная задача.
