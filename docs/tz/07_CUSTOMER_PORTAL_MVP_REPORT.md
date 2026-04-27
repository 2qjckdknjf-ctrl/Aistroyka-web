# Phase 7 — Customer portal MVP (отчёт-заготовка)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 7 и §6.13.

---

## Статус

**OPEN** — полноценный MVP кабинета заказчика по §6.13 **не инвентаризировался** в этом цикле до уровня приёмки.

## Уже существующие зачатки в коде (для будущего сбора)

- API: `client-portal`, `client-view`, `client-requests`, stakeholder-обсуждения и уведомления под `app/api/v1/projects/[id]/…`.
- UI: сегменты client portal в dashboard (`ClientPortalViewClient.tsx` и связанные компоненты).

## Следующие работы (когда фаза активирована)

1. Модель ролей «client» vs stakeholder и матрица видимости (без утечки cost/admin).
2. Сценарии приёмки §6.13: read-only проект, timeline, фото/отчёты, decisions, комментарии, уведомления.
3. Тесты и smoke только после явного scope lock.

## Шаблон ТЗ §12

- **PHASE STATUS:** OPEN  
- **NEXT PHASE ALLOWED:** N/A (не стартовали)  
- **Gate:** по ТЗ Phase 7 только после закрытия предыдущих фаз продуктом — **решение владельца**
