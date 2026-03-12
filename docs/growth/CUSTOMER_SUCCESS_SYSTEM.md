# Customer Success System

**Phase 8 — Pilot Rollout & Growth**  
**Support foundation for pilot and scale.**

---

## Support channels

| Channel | Use | Owner |
|---------|-----|--------|
| **Email** | Primary for pilot: support@ or dedicated pilot inbox. Async; good for screenshots and request_id. | CS / Ops |
| **Chat** | Optional: Slack/Teams channel or in-app chat for faster response. | CS |
| **In-app** | Link to help docs or “Contact support” with pre-filled app version and tenant (no PII). | Product |

**Pilot:** At minimum one dedicated email; response time target below. Add chat when capacity allows.

---

## SLA levels

| Severity | First response | Target resolution | Example |
|----------|----------------|-------------------|---------|
| **P0 – Critical** | 1 hour | 4 hours | App down; no one can log in; data loss risk. |
| **P1 – High** | 4 hours | 24 hours | Core flow broken (e.g. report submit fails for all). |
| **P2 – Medium** | 24 hours | 72 hours | Feature broken for some (e.g. one device type). |
| **P3 – Low** | 72 hours | Backlog | Cosmetic; workaround exists; feature request. |

**Business hours:** Define (e.g. 9–18 local or UTC); P0/P1 may require on-call outside hours for pilot.

---

## Issue severity classification

| Severity | Definition | Who decides |
|----------|------------|-------------|
| **P0** | Pilot or production blocked; no workaround. | First responder escalates; L2/L3 confirm. |
| **P1** | Major feature broken for many users; workaround difficult or none. | L1/L2. |
| **P2** | Degraded or broken for subset; workaround available. | L1. |
| **P3** | Minor; UX; feature request. | L1. |

**Rules:** When in doubt, classify one level higher. Reclassify when new info appears.

---

## Response playbook

1. **Acknowledge:** Reply to user (email/chat) that the issue was received and severity (if possible).
2. **Triage:** Classify severity; collect: tenant_id, user_id (if safe), app version, device, request_id (if error), steps to reproduce.
3. **Diagnostics:** Ask user for Diagnostics screen (iOS) or request_id (web) when relevant; do not ask for passwords or tokens.
4. **Route:** P0/P1 → L2 immediately; P2 → L2 within SLA; P3 → backlog or FAQ.
5. **Resolve or workaround:** Fix, workaround, or timeline; communicate back to user.
6. **Close:** Log resolution; if bug, ensure ticket or request_id is in backlog.

**Escalation:** L1 cannot resolve within SLA → L2. L2 cannot resolve or P0 → L3. Document escalation path in runbook.

---

## Knowledge base structure

- **Getting started:** Sign up, invite, first login, install app.
- **Managers:** Assign task, review report, view reports inbox, notifications, Settings/Diagnostics.
- **Workers:** Start shift, create report, submit report, sync, Support/Diagnostics.
- **Troubleshooting:** Can’t log in; report stuck; sync issues; upload failed; notifications not received.
- **Admin:** (If applicable) Billing, team roles, privacy settings.
- **Pilot-specific:** Pilot timeline, feedback process, who to contact.

**Format:** Short articles with steps and screenshots; link from in-app help and support replies.

---

## FAQ topics

- How do I invite a team member?  
- How do I assign a task to a worker?  
- Worker doesn’t see the task — what to check?  
- How do I submit a report from the app?  
- Report is “pending” — what does that mean?  
- How do I approve or request changes on a report?  
- Where do I find my app version / request ID for support?  
- What if I’m offline? (Sync when back online.)  
- How do I get the iOS/Android app? (TestFlight / internal link.)

---

## Troubleshooting scripts

**Login fails (401 / session expired)**  
→ Sign out and sign in again; clear cookies if web; check invite link was accepted.

**Report submit fails (4xx/5xx)**  
→ Ask for request_id and app version; check Diagnostics (sync status, last error). Look up request_id in logs; check rate limit and tenant status.

**Worker doesn’t see task**  
→ Confirm task is assigned to that worker; confirm worker is in correct project; ask worker to pull-to-refresh or restart app; check sync status in Diagnostics.

**Upload stuck / pending**  
→ Check network; check storage limit (tenant); look at upload_sessions and job queue in backend; provide request_id for trace.

**Notifications not received**  
→ Confirm push permission; confirm device token registered; check push outbox and delivery runbook (docs/runbooks/PUSH_DELIVERY).

**Use:** L1 runs through script; escalates to L2 with request_id and script outcome when unresolved.
