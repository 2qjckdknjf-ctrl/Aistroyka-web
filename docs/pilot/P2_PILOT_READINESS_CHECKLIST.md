# P2 — Pilot Readiness Checklist

**Version:** 2026-07-03 (P3 update)  
**Purpose:** Pre-kickoff checklist for first real client pilot.  
**Primary path:** **Web + iOS** (Android deferred per P3).

---

## Platform scope (P3 decision)

| Item | Status |
|------|--------|
| **Android scope** | **Deferred — not required for first pilot** (P3 Option A; Phase 6 YES — DEFERRED 2026-07-30) |
| **iOS/web path** | **Primary pilot path** |
| Android Worker/Manager in client SLA | **Not promised** unless owner reverses P3 defer |
| Owner sign-off on defer | **Pending** — see `docs/mobile/P3_ANDROID_DEFER_DECISION.md` |

---

## P0 — Live truth

- [ ] Production `buildStamp.sha7` matches intended deploy commit
- [ ] Staging health OK (`GET /api/v1/health`)
- [ ] Env/config gate script pass (or blockers documented)
- [ ] Pilot smoke (`scripts/smoke/pilot_launch.sh`) critical paths PASS
- [ ] Step 13 cost layer verified on target Supabase

---

## P1 — Manager workflows

- [ ] Document create → upload → link flow usable
- [ ] Approval queue shows pending reports/docs
- [ ] Approve / reject / request changes works
- [ ] Resubmit flow closed (changes_requested → resubmit)

---

## P2 — Pilot packaging

- [ ] Pilot dataset prepared (staging-first)
- [ ] Role smoke PASS (owner, admin, manager, worker, client)
- [ ] Client/owner views show no internal finance leak
- [ ] Onboarding runbook approved
- [ ] Client demo script ready
- [ ] Support / escalation contacts confirmed

---

## Mobile (iOS — in scope)

- [ ] TestFlight build available for manager and/or worker as needed
- [ ] At least one physical iOS device smoke completed
- [ ] Worker: login → task → report → photos → submit verified
- [ ] Manager (if mobile): inbox → review action verified

---

## Mobile (Android — out of scope for first pilot)

- [ ] **N/A** — Android deferred (P3 Option A)
- [ ] If client later requires Android: re-open P3 and owner authorize MVP plan

---

## Client kickoff

- [ ] Pilot sponsor and primary contact named
- [ ] Device policy communicated (iOS/web; Android not in scope)
- [ ] First-week milestones agreed (e.g. N reports submitted)
- [ ] Feedback channel defined

---

## GO / NO-GO

| Gate | Owner |
|------|-------|
| All P0–P2 items checked or accepted PARTIAL with documented blockers | _____________ |
| P3 Android defer sign-off | _____________ |
| Pilot start authorized | _____________ |
