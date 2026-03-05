# Release runbook

## Rollout steps

1. **Pre-release:** Run smoke matrix (scripts/smoke-v1.sh, smoke-mobile.sh, smoke-admin.sh). Ensure staging parity.
2. **Feature flags:** Freeze or set flags for rollout (GET/POST /api/v1/admin/flags). Use percentage or allowlist.
3. **Deploy:** cf:build && wrangler deploy (or provider pipeline). Monitor health and SLO.
4. **Post-release:** Check GET /api/v1/admin/slo/overview; resolve alerts if any.

## Rollback steps

1. Revert to previous deployment (wrangler rollback or redeploy prior build).
2. If DB migration was applied, assess backward compatibility; revert migration only if safe and documented.
3. Notify and post-mortem if user-facing.

## Incident handling

- See docs/runbooks/incident-response.md. Alert on SLO breach (2 consecutive windows), job failure spike, AI cost spike. Use GET /api/v1/admin/alerts.

## How to freeze flags

- GET /api/v1/admin/flags to list. POST /api/v1/admin/tenants/:id/flags with { key, enabled: false } to disable for a tenant. Reduce rollout_percent or clear allowlist on feature_flags for global rollback.
