# P4 — Project Setup Runbook

**Date:** 2026-07-03  
**Phase:** P4 Task C  
**Audience:** Operator + client manager (guided). **No new product development.**

---

## Prerequisites

- [ ] Tenant and users created (`P4_TENANT_ACCOUNT_SETUP_RUNBOOK.md`)
- [ ] Environment chosen (staging dry-run recommended first)
- [ ] Pilot project name and task list from intake form

---

## 1. Create project

**Dashboard (preferred):**

1. Sign in as owner or manager.
2. **Projects** → **Create project**.
3. Enter name, address/site notes from intake.
4. Save → record **project ID** in secure operator sheet.

**Script assist (worker membership only — project row must exist or upsert):**

See `scripts/smoke/seed_pilot_project.mjs` in tenant runbook.

---

## 2. Create milestones (optional)

1. Open project → **Milestones** (or schedule module if enabled).
2. Add 1–3 milestones matching client phases (e.g. Demo, Rough-in, Finish).
3. Link tasks to milestones where UI supports it.

**Default if skipped:** tasks without milestones still valid for pilot.

---

## 3. Create tasks

**Target:** 5–15 tasks for week 1; 10–20 active tasks for 2-week pilot.

1. Project → **Tasks** → **Create task**.
2. Title, description, assignee (worker), due date optional.
3. Status: open / assigned.
4. Repeat for each work item from intake.

**Verification:**

- Worker signs in (iOS Worker or web) → sees task in **today's tasks** or project task list.
- Manager sees tasks on project detail.

---

## 4. Assign workers

1. Ensure workers are in **tenant_members** (invite flow).
2. Add **project_members** for each worker on this project.
3. Assign tasks to specific workers.

**Check:** Each active worker has ≥1 assigned task for Day 1.

---

## 5. Add documents (optional)

If documents/acts in pilot scope (P1 closed):

1. Project → **Documents**.
2. Create document record → upload file.
3. Link to project; optional link to task/milestone.
4. Move through review states if testing doc approval queue.

**Skip if pilot is report-only** — document in intake.

---

## 6. Add cost items (optional, internal)

**Customer finance rule:** Cost/budget data is **contractor-internal**. Do not expose to stakeholder portal unless explicitly designed customer-facing commercial artifact.

1. Project → **Budget / Cost** (Step 13 layer).
2. Add baseline cost lines for manager visibility only.
3. Verify stakeholder portal does **not** show internal costs.

**Verify script (operator, staging/prod):**

```bash
# See docs/pilot/P0_STEP13_COST_LIVE_VERIFICATION.md
node apps/web/scripts/verify-cost-runtime.mjs
```

---

## 7. Prepare manager queue

1. Manager opens **Dashboard → Approvals** (or reports inbox).
2. Confirm empty queue or seeded pending items.
3. Optional: worker submits one **test report** during staging dry-run to populate queue.

**Expected:** Submitted reports and pending documents appear with links to project/report.

---

## 8. Prepare stakeholder / client view

1. Complete stakeholder invite (tenant runbook).
2. Stakeholder accepts → open **portal** project view.
3. Verify visible:
   - Progress / status summaries (customer-safe)
   - Photos / reports **approved** or intentionally shared
   - Documents client is meant to see
4. Verify **not visible:**
   - Internal costs, margin, subcontractor costs
   - Internal AI finance risks
   - Draft/unapproved internal-only artifacts (per policy)

---

## 9. Verify report / media flow

**Staging dry-run (operator or pilot manager + worker):**

| Step | Actor | Action | Pass criteria |
|------|-------|--------|---------------|
| 1 | Worker | Start shift (iOS Worker) | Shift active |
| 2 | Worker | Create report on assigned task | Report ID created |
| 3 | Worker | Attach before/after photos | Upload completes |
| 4 | Worker | Submit report | Status `submitted` |
| 5 | Manager | Open report in inbox | Report visible with media |
| 6 | Manager | Approve or request changes | Status updates |

**API smoke (no UI):**

```bash
bash scripts/smoke/ios_mobile_api_chain.sh
```

**Known gap to watch:** Media attach may need dedicated smoke if not in chain run — confirm photos visible in manager UI before Day 0.

---

## 10. Verify approval flow

1. Manager opens submitted report.
2. Test **approve** on one staging report.
3. Test **request changes** on second report → worker resubmits (iOS Worker resubmit flow).
4. Confirm approval events visible in manager queue/history.

---

## 11. Verify cost / document / schedule visibility

| Surface | Manager | Stakeholder |
|---------|---------|-------------|
| Schedule / milestones | Yes | Customer-safe summary only |
| Documents (approved) | Yes | If shared to client |
| Internal costs | Yes | **No** |
| Report photos | Yes | Approved/shared only |

---

## Pilot dataset scripts (repo state)

| Script | Status | Usage |
|--------|--------|-------|
| `scripts/smoke/seed_pilot_project.mjs` | **Present** | Idempotent project + worker membership |
| `scripts/pilot/setup_pilot_dataset.sh` | **Not on branch** | When merged: use **dry-run default**, `--apply` staging-first, `PILOT_ALLOW_PRODUCTION=YES` guard |

**Until unified script exists:**

1. Manual dashboard steps (sections 1–6 above).
2. Optional service-role seeds for project_members only.
3. Document all UUIDs in operator secure sheet.

**Staging-first rule:** Complete sections 1–11 on **staging** → sign staging checklist → repeat minimal path on **production pilot tenant**.

**Production protection:** Do not run service-role bulk seeds against production without owner approval and client data review.

---

## Rollback

- Delete test reports via dashboard (if policy allows) or mark cancelled — **escalate** before bulk SQL.
- Revoke mistaken stakeholder invite immediately.
- Re-create tasks if wrong assignments — prefer edit over delete.

---

## Related docs

- `docs/launch/P4_TENANT_ACCOUNT_SETUP_RUNBOOK.md`
- `docs/launch/P4_FIRST_WEEK_OPERATING_PROTOCOL.md`
- `docs/pilot/P0_PILOT_E2E_VERIFICATION.md`
