# P3 — Android Pilot Requirement Check

**Date:** 2026-07-03  
**Phase:** P3 Task B  
**Assumption:** P0, P1, P2 closed per program state; first client pilot package targets **web + iOS** path.

---

## 1. Sources consulted

| Document | Relevant finding |
|----------|------------------|
| `docs/pilot/PILOT_READINESS_ROADMAP.md` | Android = buildable foundation; **must not block pilot**; P3 Option A recommended |
| `docs/pilot/PILOT_BACKLOG_PRIORITIZED.md` | P3.0 defer vs MVP; Option A recommended |
| `docs/pilot/P0_GO_NO_GO.md` | **Android blocks pilot: NO** — defer to P3 Option A |
| `docs/pilot/P0_PILOT_E2E_VERIFICATION.md` | API chain PASS on production; Android device smoke BLOCKED (no adb) |
| `docs/growth/PILOT_CLIENT_SELECTION.md` | Android only **if pilot uses Android workers** |
| `docs/release-hardening/MOBILE_PILOT_READINESS.md` | iOS-primary; Android behind iOS; no Android pilot claim without device evidence |
| `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md` | **Conflict:** 2026-03-24 lock stated Android+iOS mandatory — superseded by pilot readiness program unless owner re-confirms |

---

## 2. First pilot operational contour (current program)

Per closed P2 packaging (web/iOS path):

| Role | Primary surface |
|------|-----------------|
| Owner / admin | Web dashboard |
| Manager | Web dashboard (+ optional iOS Manager / TestFlight) |
| Worker (field) | iOS Worker (TestFlight) or web where applicable |
| Client / stakeholder | Web portal (customer-safe artifacts only) |

Pilot runbook, role smoke, and dataset scripts target **staging/production API + web + iOS**, not Android UI proof.

---

## 3. Classification

| Question | Answer | Rationale |
|----------|--------|-----------|
| **Android required for first pilot** | **NO** | No committed pilot client mandate in current docs; selection framework treats Android as conditional; P0 explicitly states Android does not block |
| **iOS/web sufficient for first pilot** | **YES** | Strongest validated contour; TestFlight build `2026063001`; web manager workflows closed in P1; P2 packaging on web/iOS |
| **UNKNOWN triggers** | Client contract requires Android field devices; >50% workers Android-only with no iOS | Escalate to owner → Option B |

---

## 4. Risk if deferred (Option A)

| Risk | Level | Mitigation |
|------|-------|------------|
| Android-only workers cannot use native field app | Medium | Provide iOS devices or accept web-limited worker path for pilot duration |
| Client expects Android because of old scope lock | Medium | Owner sign-off on defer; explicit "not promised" in kickoff |
| Technical debt accumulates | Low | Document future Worker MVP scope; revisit after pilot feedback |
| Play internal build unused | Low | Builds remain available for internal testing when scope opens |

---

## 5. Risk if started now (Option B)

| Risk | Level | Impact |
|------|-------|--------|
| Unverified code paths on real devices | **High** | Demo failure during first client week |
| Pilot timeline delay | **High** | E2E + device smoke + Play distribution + support runbook |
| Shallow MVP shipped under pressure | **High** | Offline/sync gaps vs iOS; reputational damage |
| Diverts engineering from P4 feedback loop | Medium | Violates "do not start P4" adjacent focus |

---

## 6. Pilot assumption statement (P3)

For the **first real client pilot** under the P0–P2 program:

1. **Default device policy:** Managers and workers use **web and/or iOS** unless the signed pilot agreement states otherwise.
2. **Android is optional** and **not in the committed pilot SLA** until a separate MVP phase is approved.
3. If the selected client has **only Android field devices**, treat as **UNKNOWN → owner decision** (Option B or provision iOS).

---

## 7. Task B verdict

| Field | Value |
|-------|-------|
| Android required for first pilot | **NO** |
| iOS/web sufficient | **YES** |
| Owner reconfirmation needed if `FIRST_CLIENT_SCOPE_LOCK` still binding | **YES** |
