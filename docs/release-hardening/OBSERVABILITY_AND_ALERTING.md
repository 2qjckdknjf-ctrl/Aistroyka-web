# Observability and alerting

## Current capabilities

- **Health:** GET /api/health, /api/v1/health (ok, components, build stamp when set).
- **Structured logs:** logStructured with event, request_id, route, duration_ms, tenant_id.
- **Ops API:** GET /api/v1/ops/overview, /api/v1/ops/metrics (tenant-scoped); admin metrics and SLO.
- **Admin:** Jobs (failed list), AI usage, push outbox, audit logs.

## Release health checklist

- [ ] Health endpoint monitored (e.g. every 5 min); alert on non-200 or ok:false.
- [ ] Cron-tick monitored if called by scheduler; alert on non-2xx.
- [ ] Logs ingested (Cloudflare Workers logs or drain); searchable by request_id.
- [ ] Build stamp/version visible (NEXT_PUBLIC_BUILD_SHA in health or header).

## Alerting scaffolding (external)

No in-app alert dispatch in repo. Use external services:

- **Slack:** Incoming webhook; POST on alert condition (e.g. health failure from monitor).
- **PagerDuty:** Integration with monitoring (e.g. Better Uptime, Checkly) that hits health/cron.
- **Webhook:** Any HTTP endpoint; monitoring tool calls it when threshold breached.

## Alertable conditions

| Condition | How to detect | Action |
|-----------|----------------|--------|
| Health failure | GET /api/health !== 200 or body.ok === false | Page or Slack |
| Cron failure | Scheduler receives non-2xx from cron-tick | Retry; alert after N failures |
| 5xx spike | Log or Workers analytics 5xx rate | Investigate; rollback if needed |
| AI failure spike | ai_usage or logs; high failure rate | Check provider; circuit breaker |
| Failed job buildup | GET /api/v1/admin/jobs?status=failed count | Investigate; runbook |

## First 72h

See FIRST_72H_OPERATIONS_CHECKLIST.md.
