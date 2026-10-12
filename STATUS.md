# STATUS — AISTROYKA

Факты сверены 2026-10-12. Последний наблюдённый main: `7fc8fa2d588f159fe19b7fd2d4baa2b2add7c422` (#435). Текущий main при продолжении определяется свежим `origin/main` и GitHub. Проверенный runtime оригиналов: `fac7a17` (#437), staging 38189852934 SUCCESS, 13 живых HTTP-проверок PASS; production 38190089187 SUCCESS, apex/www обслуживают `fac7a17`.

Активное продолжение: `audit/live-worker-vision-flow-2026-10-12` в `/Users/alex/Projects/AISTROYKA-main-clean`, исправление ожидания audit события Vision и запись живого job/provider/result proof. #435 защищённо объединён на HEAD `4d3ddf75` после CI 38190538632 и трёх приложений smoke 38190538635 SUCCESS; его runtime проверяется отдельно. Архивная рабочая папка Manager сохраняется чистой; не создавать повторную native публикацию. Перед продолжением получить свежие PR HEAD/check/review и выполнить preflight.

| Контур | Факт | Следующая работа |
|---|---|---|
| Оригиналы и доступ | #433/#434 вызвали runtime-регрессию; #436 локализовал stream_open; #437 исправил несовместимый redirect:error. Пять реальных SDK/Workerd контрактов и 13 живых PNG/Proof Pack/PDF/revocation проверок PASS | Проверить production и свежий SHA после последующих публикаций |
| Публикация | #432 web/API/unique-source rollout доставлен; #435 native Manager реализован, live simulator 1/1 PASS и независимый readback published=false; три приложения smoke PASS на предыдущем HEAD | CI/review #435 завершены; проверить runtime, затем полный Worker capture/upload/submit → review/publication |
| Customer | #431 web/iOS gallery и live simulator image decode PASS | Физический iPhone Offline; manual keyboard/OAuth/push/offline/store проверяются отдельно |
| Vision | #438 исправил transport; живой job завершён, один результат привязан к media/job/tenant; strict provider gate exit 0, fallback 0 | Durable audit readback; reviewed observations, video executor и Graph lineage |
| БД и очистка | 11 источников / 10 remote IDs в receipts, 199 записей истории; в этом срезе новых DDL нет. Свежий тестовый PNG/PDF/share/document, восемь записей и Auth удалены; task sessions закрыты | Historical full-reset/drift отдельно; до каждого apply свежий receipt preflight, применённый SQL неизменен |
| План | Ручной intake, async request_key, Graph persistence и Customer уже существуют | Source-linked Vision/Graph → reviewed preproject extractor; Android D2/live camera после зависимостей. Legal/store/billing 7-day gates требуют реальных внешних/временных доказательств |

[Async Vision live proof](docs/reports/async-vision-live-2026-10-12/RESULT.md), [Runtime repair](docs/reports/private-original-runtime-2026-10-12/RESULT.md), [native Manager](docs/reports/manager-native-publication-2026-10-12/RESULT.md), [registry](docs/tasks/ACTIVE_WORK_REGISTRY.csv), [plan/fact](docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md), [receipts](docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md). 74 старых смешанных PR требуют semantic review; dirty/ahead/release/cursor источники сохранены. Полная готовность проекта остаётся открытой.
