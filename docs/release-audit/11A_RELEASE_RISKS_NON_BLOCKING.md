# Release Audit — Phase 11A: Release Risks (Non-Blocking)

**Generated:** Release Readiness Audit  
**Use:** Prioritize hardening and monitoring; not go/no-go blockers.

---

## R1: Legacy API routes without explicit requireTenant

- **Risk:** New contributors may add legacy-style routes that rely only on RPC for tenant isolation.
- **Mitigation:** Prefer v1 for all new features; add requireTenant to legacy routes or document RPC contract.
- **Fix after launch:** Optional refactor to align all routes with v1 pattern.

---

## R2: Webhook idempotency

- **Risk:** Stripe may retry webhook; duplicate processing possible if handler is not idempotent.
- **Mitigation:** Stripe event id is unique; consider storing processed event ids and skipping duplicates.
- **Fix after launch:** Add idempotency table for webhook events if needed.

---

## R3: No in-app alerting

- **Risk:** Incidents detected only by external monitoring or manual check.
- **Mitigation:** Use external uptime and cron checks; log aggregation with alerts.
- **Fix after launch:** Add webhook or callback for SLO breach to Slack/PagerDuty.

---

## R4: Mobile crash visibility

- **Risk:** iOS app crashes not visible without crash reporting.
- **Mitigation:** Add Sentry or similar for manager and lite before wider pilot.
- **Fix after launch:** Integrate crash reporting and symbolication.

---

## R5: AI cost runaway

- **Risk:** No hard budget cutoff; high usage could increase cost.
- **Mitigation:** recordUsage and cost estimation; monitor usage table; set billing alerts.
- **Fix after launch:** Optional per-tenant or global budget cap in policy.

---

## R6: Rate limit coverage

- **Risk:** jobs/process is rate-limited; other expensive endpoints may not be.
- **Mitigation:** Current coverage acceptable for pilot; expand if abuse observed.
- **Fix after launch:** Add rate limits to login or other high-risk endpoints if needed.

---

## R7: Offline mobile behavior

- **Risk:** Worker Lite offline behavior not documented or guaranteed.
- **Mitigation:** Document expected behavior; sync when back online.
- **Fix after launch:** Implement or document offline queue if required.

---

## R8: E2E test coverage

- **Risk:** E2E not run in audit; regressions possible.
- **Mitigation:** Run Playwright in CI against staging; add critical path E2E.
- **Fix after launch:** Expand E2E for checkout and AI flows.

---

## R9: Localization completeness

- **Risk:** Some strings may fall back to key or default locale.
- **Mitigation:** Four locales present; fallbacks on dashboard prevent crash.
- **Fix after launch:** Audit missing keys and add translations.

---

## R10: Admin job failure visibility

- **Risk:** Failed jobs visible in jobs table but no dedicated DLQ UI.
- **Mitigation:** Admin jobs page and job_events; manual query if needed.
- **Fix after launch:** Add "failed jobs" filter and retry action in admin.
