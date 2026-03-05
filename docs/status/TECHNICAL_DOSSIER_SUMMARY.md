# Вывод технического досье Aistroyka

Полное досье: **[TECHNICAL_DOSSIER.md](./TECHNICAL_DOSSIER.md)**

---

## Структура досье (9 разделов)

1. **Репозиторий** — карта директорий (frontend/backend/edge/migrations/ai/prompts/workers), дерево, entrypoints.
2. **Data model** — таблицы, tenant_id/project_id/user_id, RLS (жёсткие политики после `20260301120000_rls_hardening.sql` vs permissive на media, analysis_jobs и др.), индексы, миграции.
3. **Multi-tenant** — политики и тесты (RLSValidationTests), пути Edge с user JWT; все места с service role (aistroyka-ai-memory:576, aistroyka-llm-copilot:282, stripe-webhook:55, web admin.ts, upload route).
4. **AI/LLM** — call sites (Edge Copilot, Web analyze-image, iOS LLMCopilotService), модели/параметры, абстракции и fallback, structured output, промпты, CONTEXT_VERSION/PROMPT_VERSION.
5. **RAG** — не используется; только RAG-lite (historical_context в Copilot).
6. **Jobs** — создание/исполнение (engine worker, runOneJob, iOS AnalysisJobProcessor), RPC dequeue/claim/complete, retry/idempotency/dead.
7. **Observability** — логи, ai_llm_logs, токены/бюджет, таксономия ошибок, debug.
8. **Тестирование** — unit/integration (iOS/Web), нет LLM eval/golden, текущие сбои из аудита.
9. **Итог** — что работает/не работает по модулям, риски P0/P1/P2, roadmap на 2 недели и 2 месяца.

---

## Главные риски

| Приоритет | Риск |
|-----------|------|
| **P0** | RLS permissive на media, analysis_jobs, ai_analysis, tenant_members, tenants — возможен cross-tenant доступ. |
| **P0** | Edge aistroyka-ai-memory использует service role для большинства действий — обход RLS. |
| **P1** | Нет RLS на ai_llm_logs; backend/RLS тесты требуют env. |
| **P2** | Force unwraps в iOS; нет LLM eval / golden suite. |

---

## Рекомендованный roadmap

**2 недели:** доработка RLS (media, analysis_jobs, ai_analysis); переход Edge на user JWT для tenant-scoped операций; фикс/ gate тестов; обновление документации.

**2 месяца:** полный RLS по всем таблицам; структурированное логирование и метрики; LLM eval / golden; усиление воркеров и idempotency.
