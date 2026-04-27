# Phase 6 — Copilot productization (отчёт)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 6 и §6.6.

---

## A. Статус фазы

| Поле | Значение |
|------|----------|
| **Статус** | **PARTIAL** |
| **Следующая фаза разрешена** | **YES** для Phase 7 **планирования**; полноценный customer portal — только после явного закрытия P0 из Phase 0/1 |

---

## B. Что подтверждено кодом и тестами

| Требование ТЗ | Факт |
|----------------|------|
| Streaming (SSE/поток) | `POST …/projects/[id]/copilot/chat/stream` + тесты `route.test.ts` (события start/first_token/done, fallback) |
| Context budget | `lib/copilot/context-budget.test.ts` и телеметрия в stream route |
| Fallback при недоступности провайдера | тест «deterministic done» при non-OK провайдера |
| Tenant / project в контексте | проверки в route (tenant context, project id) |
| Память / записи | `ai/memory/*` маршруты, `lib/ai-brain/phase-c/memory/*` |

---

## C. Что остаётся OPEN по ТЗ

| Тема | Комментарий |
|------|-------------|
| Полноценный RAG | ТЗ §6.6 «доделать» — **частично** есть memory/context; не эквивалент полному RAG |
| Document-aware / schedule-aware / cost-aware в одном ответе | нужна сквозная продуктовая спека + тесты |
| Стриминг «не fake typing» | автотесты эмулируют провайдера; **live** стрим на staging — `ai_phase5_gate.sh` (см. deploy workflow, non-blocking) |

---

## D. Рекомендации

1. Расширить **blocking** gate для staging опционально успешным `INCLUDE_STREAM=1` при стабильном ключе AI (сейчас часть gate может быть `continue-on-error` — сверить `deploy-cloudflare-staging.yml`).
2. Связать Copilot suggestions с **manager actions** (ссылки на сущности).

---

## E. Шаблон ТЗ §12

- **PHASE STATUS:** PARTIAL  
- **NEXT PHASE ALLOWED:** YES (с оговорками)  
- **NEXT WORKSTREAM:** Phase 7 customer portal MVP или enterprise Phase 8 по приоритету продукта
