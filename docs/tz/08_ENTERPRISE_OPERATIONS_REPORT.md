# Phase 8 — Enterprise operations (отчёт-заготовка)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 8.

---

## Статус

**PARTIAL** на уровне **кода-зачатков** (ops metrics, admin diagnostics, SLO, security posture, audit logs API, anomaly routes).  
**OPEN** на уровне **эксплуатации** в смысле ТЗ: единый операторский контур за 5 минут до инцидента, политики алертинга, централизованные дашборды вне репо.

## Что уже есть в репо (выборочно)

- `app/api/v1/ops/overview`, `ops/metrics`
- `app/api/v1/admin/ops/diagnostics`, `admin/slo/*`, `admin/security/posture`, `admin/audit-logs`, `admin/anomalies`
- Runbooks в `docs/runbooks/`, `docs/reliability/`

## Пробелы относительно §8 приёмки

- Нет доказательства, что все метрики **собираются** в одной observability-платформе.
- Alerting policies — в основном документация; связка с PagerDuty/Cloudflare Workers Analytics — **NEEDS_LIVE_VERIFICATION**.

## Шаблон ТЗ §12

- **PHASE STATUS:** OPEN / PARTIAL  
- **NEXT PHASE ALLOWED:** N/A как «закрытая программа» — это непрерывный контур
