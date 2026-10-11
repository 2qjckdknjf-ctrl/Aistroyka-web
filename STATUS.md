> Продолжение 2026-10-11: #420 merged (2d5e44ba); staging/production/apex/www 2d5e44b verified, authenticated live AI gates PASS without fallback. Scoped session RPC migration applied as 20261011112358; six source receipts under five remote IDs. Current task: media/result RLS fix from a fresh 2d5e44ba baseline, with synthetic before/after proof; it is not applied yet. Physical iPhone is accessible, Worker/Manager installed, Customer absent; device smoke remains pending. See docs/reports/2026-10-11-ai-security-continuation.md. Earlier dated observations below remain historical.

# STATUS — AISTROYKA

Обновлено 2026-10-11. Источник кода — свежий origin/main; даты и SHA ниже являются наблюдением, а не обещанием текущего состояния без повторной проверки.

| Что | Подтверждено |
|---|---|
| Рабочая папка | /Users/alex/Projects/AISTROYKA-main-clean; workspace_preflight перед задачей |
| Код | #410/#411/#413/#415/#416/#417 merged; #385/#386 и intake PATCH/submit/withdraw уже в main |
| Live БД | Intake + lifecycle guard, 4-arg create_analysis_job, private helpers, timestamp search_path и FK indexes применены |
| Intake API | Create/edit/submit/withdraw, идемпотентность и запреты переходов PASS; синтетические записи удалены |
| Публикация | staging и production HTTP 200, buildStamp.sha7 = 35fa334 (проверка 2026-10-11 09:58 UTC); health и workflow evidence в отчёте ниже |
| Реестр | Все 75 старых открытых PR учтены; head_sha = HEAD PR, merge_sha = коммит объединения |
| Следующая инженерная очередь | Сначала semantic audit существующих security/AI PR и полный portal/device scope; затем недостающий async scope extraction по плану |

[Операционный отчёт](docs/reports/2026-10-11-operational-closure.md), [актуальная сверка плана](docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md), [реестр](docs/tasks/ACTIVE_WORK_REGISTRY.csv).

Разрешение на выполненный DB apply и deployment получено в этой переписке. Не запрашивать его повторно и не переисполнять SQL: пять исходных файлов уже применены под четырьмя remote IDs. [Receipts и read-only guard](docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md) обязательны перед следующей миграцией. Это не полное исправление исторического migration drift; broad db push --include-all запрещён до отдельной сверки.

Не разрабатывать заново: Customer iOS #372/#375/#382, Graph #376, Vision #377/#385, video authz #386, intake #378/#404/#405/#406/#411, daily-log persist B2, ROMA advisory #407 и Android audit D1 #408. CRUD intake не равен автоматическому AI scope extraction: эта часть AIS-CLIENT-005A ещё требует hard audit/реализации. Live camera/voice 005B и Android D2 остаются в установленной очереди зависимостей.

#281/#289/#293 дополнительно закрыты как включённые после blob-сверки; все ветки сохранены. #347/#351 закрыты ранее как включённые; #317/#348/#352 — как заменённые. Остальные старые PR нельзя объединять целиком без semantic audit.

Остаются отдельные фактические gates: физический device smoke, store assets/distribution, 7-day billing shadow/cutover, LEGAL и полный portal/revocation/export/AI-summary proof. Подтверждение одного live AI-вызова не закрывает весь AI roadmap. Pilot scope — contractor-ops-only; DAG 100% не объявлен завершённым.
