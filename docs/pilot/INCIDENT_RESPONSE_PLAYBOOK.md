# Incident Response Playbook — Pilot

**Phase 6 — Pilot Deployment & Observability**

---

## Severity levels

| Level | Definition | Response |
|-------|------------|----------|
| **P0 / Critical** | Pilot-blocking: auth broken, report submit failing for all, dashboard unreachable, data loss risk | Immediate triage; all hands; rollback if needed |
| **P1 / High** | Major feature broken for many users (e.g. sync failing, uploads stuck, notifications not sent) | Triage within 1–2 hours; hotfix or rollback |
| **P2 / Medium** | Degraded experience or feature broken for subset (e.g. one tenant, one device type) | Triage within 24h; fix in next release or workaround |
| **P3 / Low** | Minor UX, cosmetic, or edge case | Backlog; fix when possible |

---

## Incident triage flow

1. **Acknowledge:** Confirm incident (user report, alert, or dashboard).
2. **Severity:** Classify P0–P3 using table above.
3. **Scope:** Who/what is affected? (tenant, app version, route, device.)
4. **Correlate:** Use request_id, tenant_id, route, timestamp from logs; check diagnostics and runbooks.
5. **Failure domain:** Map to one of the domains below; follow “who checks what” and runbook links.
6. **Mitigate:** Fix, rollback, or workaround; communicate to pilot if needed.
7. **Close:** Document cause, action taken, and follow-up (post-mortem, backlog).

---

## Rollback / hotfix flow

- **Web/Backend:** Revert to previous deployment (Vercel/Cloudflare); verify health and smoke checks. If hotfix: branch from main, minimal fix, test, deploy, then merge back.
- **iOS:** No server-side rollback of app. Instruct users to stay on or reinstall previous TestFlight build if critical; otherwise fix forward.
- **Secrets/config:** If incident is misconfiguration, fix env and redeploy; do not roll back code unless config is in code.

---

## Who checks what first

| Failure domain | First check | Runbook / notes |
|----------------|-------------|------------------|
| **Auth** | Supabase auth status; cookie/session; `/api/_debug/auth` (dev); auth_login logs | Login flow; token refresh |
| **Tenant context** | Tenant membership (tenant_members); getTenantContextFromRequest; 403/401 by route | Tenant invite/accept; RLS |
| **Report submit** | POST /api/v1/worker/report/submit logs; request_id; 4xx/5xx; idempotency | Report service; lite idempotency |
| **Upload sessions** | Upload-session create/finalize; job process; storage; request_finished for upload routes | MOBILE_UPLOADS runbook; job handlers |
| **Notifications** | Notification creation (DB); push enqueue and delivery (push runbook); device tokens | PUSH_DELIVERY runbook |
| **Sync** | Sync bootstrap/changes/ack; 409 and sync_conflict logs; device cursor; rate limit | Sync service; retention |
| **Review actions** | PATCH reports/:id; task assign; manager permissions | Task/report services; RBAC |

---

## Known failure domains (summary)

- **Auth:** Session expiry, wrong env (Supabase URL/keys), rate limit (429 on login).
- **Tenant context:** User not in tenant_members; wrong tenant selected; RLS blocking.
- **Report submit:** Validation, task_invalid, idempotency replay; backend 5xx.
- **Upload sessions:** Size limit, finalize failure, job not processing, storage/network.
- **Notifications:** Not created (missing trigger); push not sent (token, provider); delivery not tracked.
- **Sync:** 409 must_bootstrap; cursor/device mismatch; rate limit; offline.
- **Review actions:** Insufficient rights; invalid report/task id; network/timeout.

---

## Escalation

- **P0:** Notify pilot lead and platform; consider rollback within 30–60 min if no fix.
- **P1:** Assign owner; ETA for fix or rollback; update pilot if ETA > 2 h.
- **P2/P3:** Ticket and backlog; communicate if workaround available.

---

## Related runbooks

- `docs/runbooks/incident-response.md` — AI/circuit/rate-limit and other platform runbooks.
- `docs/runbooks/MOBILE_UPLOADS.md` — Upload flow and troubleshooting.
- `docs/runbooks/PUSH_DELIVERY.md` — Push notification delivery.
