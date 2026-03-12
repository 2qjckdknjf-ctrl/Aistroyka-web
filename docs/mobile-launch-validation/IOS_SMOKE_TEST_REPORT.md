# iOS Smoke Test Report — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. Scope

Smoke test covers minimum viable flows for AiStroykaWorker and AiStroykaManager. **Automated simulator run was not possible** (Simulator boot failure in environment); this report defines the **manual smoke checklist** and expected behavior.

---

## 2. AiStroykaWorker — smoke checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Launch app | App starts; no immediate crash. |
| 2 | Login flow | Login screen appears; sign-in with valid Supabase/backend succeeds; invalid/missing config shows error, not crash. |
| 3 | Home / tasks route | After login, home or tasks list is visible (or empty state). |
| 4 | Report create entry | Can open report-creation flow; before/after photo and submit path are reachable. |
| 5 | Sync/upload/bootstrap | Sync/upload/bootstrap logic runs or shows clear error when backend unavailable; no hard-crash. |

**Without backend:** UI flow and navigation should still work; login and API calls fail gracefully with error state.

---

## 3. AiStroykaManager — smoke checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Launch app | App starts; no immediate crash. |
| 2 | Login flow | Login or unauthorized view appears; sign-in succeeds when backend/Supabase configured. |
| 3 | Dashboard / home shell | After login, dashboard or home is visible. |
| 4 | Projects / tasks / reports tabs | Tabs are tappable; placeholder or data loads without crash. |
| 5 | Settings / More / Notifications | Entry points open; no crash; optional: notifications list loads or shows empty/error. |

**Without backend:** Same as Worker — UI shell and navigation work; auth/API show error state.

---

## 4. Full backend auth unavailable

If full backend auth is not available locally:

- **Validate:** UI flow, navigation, and graceful failure states.
- **Expect:** Login fails with clear message; tabs/screens that depend on API show error or empty state, not crash.
- **Do not:** Fake success; document "backend not configured" in results if applicable.

---

## 5. Execution status

- **Automated smoke run:** Not executed (Simulator not available in this environment).
- **Manual execution:** To be run by engineer in Xcode on simulator (or device) using the checklists above.
- **Build status:** Both apps build successfully; ready for manual smoke.

---

## 6. Summary

Smoke test **definition and checklist** are complete. **Execution** is pending manual run from Xcode. Both apps are structured to handle missing config and backend gracefully; smoke should confirm startup, login screen, navigation shell, and error handling.
