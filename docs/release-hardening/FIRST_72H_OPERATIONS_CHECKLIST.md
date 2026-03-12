# First 72 hours operations checklist

## Hourly (first 24h)

- [ ] Health: `curl -sS https://your-app.com/api/health` → 200, `ok: true`.
- [ ] Cron: If scheduler runs every 5–15 min, confirm 2xx; alert on consecutive failures.
- [ ] 5xx rate: From Cloudflare or logs; alert if above threshold.

## Daily

- [ ] Jobs: Admin → Jobs (or GET /api/v1/admin/jobs?status=failed); investigate growth in failed/dead.
- [ ] Upload sessions: Stuck created/uploaded; compare with upload_reconcile runs.
- [ ] Auth: Login/session success (if measurable).
- [ ] AI: Usage and failure rate from logs or ai_usage table.

## Smoke commands

```bash
curl -sS https://your-app.com/api/health
curl -sS https://your-app.com/api/health/auth  # with cookie or session
# With cron secret (do not log):
# curl -X POST -H "x-cron-secret: $CRON_SECRET" https://your-app.com/api/v1/admin/jobs/cron-tick
```

## Rollback triggers

- Error rate >X% for >15 min → consider rollback.
- Health consistently failing → rollback.
- Data corruption suspected → stop cron; investigate.

## Incident priorities

1. **P0:** Site down; auth broken; data loss.
2. **P1:** Cron not running; jobs stuck; uploads failing; AI down.
3. **P2:** Single-tenant; slow; non-critical feature.
4. **P3:** Cosmetic; i18n; minor UX.
