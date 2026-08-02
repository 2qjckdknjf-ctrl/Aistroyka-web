# P4 — Support / Incident Runbook (First Pilot)

**Date:** 2026-07-03  
**Phase:** P4 Task F  
**Extends:** `docs/pilot/INCIDENT_RESPONSE_PLAYBOOK.md`, `docs/growth/CUSTOMER_SUCCESS_SYSTEM.md`

---

## Support contact / channel

| Item | Value |
|------|-------|
| Primary channel | **Email** (pilot-dedicated inbox — owner configures) |
| Example | `pilot-support@aistroyka.ai` (placeholder — replace before launch) |
| Hours | Business hours + P0 on-call (owner defines) |
| Response targets | P0: 1h / P1: 4h / P2: 24h / P3: 72h |

**Client-facing text:** See `P4_CLIENT_PILOT_BRIEF.md` § Support.

---

## Issue severity levels

| Level | Definition | Example |
|-------|------------|---------|
| **P0** | Pilot blocked for all/most users | Cannot login; submit fails for everyone |
| **P1** | Core flow broken, no easy workaround | Uploads fail consistently |
| **P2** | Subset or degraded | One device, one user |
| **P3** | Minor UX, questions | Copy confusion, feature request |

---

## Evidence to capture (every ticket)

Ask the user for:

1. **Role** (worker / manager / stakeholder)
2. **App** (web / iOS Worker / iOS Manager) + **build** (TestFlight 2026063001)
3. **Time** (timezone) + steps to reproduce
4. **request_id** (from error or Diagnostics) — web/iOS
5. **tenant_id** / project name (operator looks up UUID)
6. **Screenshot** (no passwords)

**Never collect:** passwords, full JWT, service-role keys.

---

## Protocol: login issues

1. Confirm invite accepted (tenant_members exists).
2. User: sign out → sign in again; check email/password.
3. Web: clear cookies for `aistroyka.ai`; try incognito.
4. iOS: confirm TestFlight build; confirm BASE_URL points to correct env.
5. Operator: check Supabase Auth user status (banned/disabled).
6. Check rate limit (429) on repeated attempts.
7. Escalate P0 if widespread → L2 + check `/api/v1/health`.

---

## Protocol: media upload issues

1. Confirm network (Wi‑Fi / LTE).
2. Worker: retry photo attach; check Diagnostics last error.
3. Confirm report not already submitted locked state incorrectly.
4. L2: trace upload session create/finalize via request_id; check storage policies.
5. **Fallback:** manual photo via agreed channel (WhatsApp/email) + manager adds note in dashboard — **document as pilot workaround**, not product fix.

---

## Protocol: sync issues

1. Worker: open app online → Sync now / pull refresh.
2. Check Diagnostics sync cursor / last error.
3. If 409 / must bootstrap: sign out/in once (operator guided).
4. L2: check sync logs, device cursor, rate limits (`docs/runbooks/MOBILE_SYNC.md`).
5. **Fallback:** manager verifies report on web after worker confirms submit succeeded once online.

---

## Protocol: manager approval issues

1. Confirm report status `submitted` (not draft).
2. Manager: refresh inbox; try web if iOS Manager fails.
3. Check role (admin/member) and project membership.
4. L2: PATCH `/api/v1/reports/:id` logs via request_id.
5. **Fallback:** document decision in report note + manual status follow-up — escalate if state stuck.

---

## Protocol: stakeholder access issues

1. Confirm invite not revoked; link not expired.
2. Stakeholder uses correct email; accept flow completed.
3. Verify portal route (not full dashboard tabs if viewer-only).
4. **P0 if internal finance visible** — stop portal access; L3 immediately; finance isolation audit.

---

## Rollback / fallback summary

| Scenario | Fallback |
|----------|----------|
| Upload broken | WhatsApp/email photos + manager note |
| App unusable | Web dashboard for manager; defer worker submit until fixed |
| Sync delayed | Worker submits when online; manager refreshes web |
| Total outage | Status page / email client; pause pilot clock if P0 >4h |
| Wrong data shown to client | Revoke stakeholder access; fix before re-enable |

---

## Escalation

| From | To | When |
|------|-----|------|
| L1 CS | L2 Engineering | P0/P1 or SLA breach |
| L2 | L3 Owner | Data, security, multi-tenant, >4h P0 |
| Anyone | Client sponsor | Workaround active >24h |

---

## Backend / API status check (operator)

```bash
curl -sS "https://aistroyka.ai/api/v1/health"
curl -sS "https://staging.aistroyka.ai/api/v1/health"
# Authenticated smoke (from secure env):
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

---

## Post-incident note template

```markdown
## Incident: [title]
- Date/time (TZ):
- Severity: P0|P1|P2|P3
- Tenant/project:
- Users affected:
- Symptoms:
- request_id(s):
- Root cause:
- Fix / workaround:
- Client communicated: Y/N
- Follow-up ticket:
- Prevent recurrence:
```

---

## Related docs

- `docs/pilot/INCIDENT_RESPONSE_PLAYBOOK.md`
- `docs/runbooks/MOBILE_UPLOADS.md`
- `docs/runbooks/MOBILE_SYNC.md`
- `docs/launch/P4_FIRST_WEEK_OPERATING_PROTOCOL.md`
