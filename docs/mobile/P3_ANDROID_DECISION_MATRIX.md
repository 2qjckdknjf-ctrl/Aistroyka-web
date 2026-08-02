# P3 — Android Decision Matrix

**Date:** 2026-07-03  
**Phase:** P3 Task C

---

## Options compared

### Option A — Defer Android product scope for first pilot

| Pros | Cons |
|------|------|
| Protects pilot timeline (web/iOS path already packaged) | Android field users cannot use native Worker app in pilot |
| Avoids broad mobile parity scope creep | Future catch-up work for Android Worker MVP |
| Uses proven web + iOS Manager/Worker contour | Play internal build not part of client-facing promise |
| Client feedback can guide Android priority post-pilot | Must communicate clearly if any stakeholder assumed Android |
| Aligns with `PILOT_READINESS_ROADMAP` and P0 GO/NO-GO | Historical `FIRST_CLIENT_SCOPE_LOCK` may need explicit override |

**Cost / time:** ~0 engineering weeks before pilot start (docs + owner sign-off only).

---

### Option B — Build minimal Android Worker MVP

**Defined MVP scope:**

| Capability | Repo state today |
|------------|------------------|
| Login | Code exists; **no live E2E** |
| Bootstrap / config | Code exists |
| Assigned tasks | List UI exists; task detail UI missing |
| Create report | Code exists |
| Media upload | Pipeline in ViewModel; **not device-verified** |
| Submit | Code exists |
| Basic sync/retry | Manual sync only; **no offline queue** |

| Pros | Cons |
|------|------|
| Supports Android-only field workers | New build/runtime/test surface before pilot |
| Better platform coverage story | 2–4+ weeks realistic for MVP + E2E + device smoke |
| Uses existing Kotlin scaffold | Risk of shipping shallow implementation under deadline |
| Play internal track ready | Delays first client pilot start |

**Cost / time (estimate):** 2–4 weeks engineering + 1 week validation (device smoke, staging E2E, Play internal), **high schedule risk** for first pilot.

---

## Decision criteria scorecard

| Criterion | Weight | Option A | Option B |
|-----------|--------|----------|----------|
| First pilot timeline | High | ✅ Strong | ❌ Weak |
| Evidence / proof quality | High | ✅ Web/iOS evidenced | ❌ Android unproven |
| Client value (default pilot) | High | ✅ Matches P2 package | ⚠️ Only if Android mandated |
| Engineering focus | Medium | ✅ No diversion | ❌ New surface |
| Platform coverage | Medium | ⚠️ iOS/web only | ✅ Android workers |
| Long-term debt | Low | ⚠️ Deferred MVP | ✅ Earlier start |

---

## Recommendation

**Select Option A — defer Android for first pilot.**

**Reason:**

1. P0 explicitly classified Android as **non-blocking**; P2 pilot packaging targets web/iOS.
2. Android code is **buildable foundation**, not **product-ready** (no device E2E, weak offline, signing gates open).
3. Option B introduces **high demo and schedule risk** without a documented client mandate for Android field devices.
4. Option B should trigger only on **owner-approved client requirement** or post-pilot prioritization.

**Owner sign-off:** **YES** — required to accept defer and to override `FIRST_CLIENT_SCOPE_LOCK` if still applicable.

---

## Revisit triggers (either option)

- Client contract requires Android Worker devices
- Post-first-pilot feedback ranks Android as top mobile gap
- Owner approves Android Worker MVP phase with explicit timeline (see `P3_ANDROID_DEFER_DECISION.md`)
