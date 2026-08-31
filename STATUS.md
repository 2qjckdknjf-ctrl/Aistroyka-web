# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-08-31  
**Updated by:** CI unlinkIdentity type fix + Worker resubmit camera

---

## Now

| Field | Value |
|---|---|
| **Active slice** | PR #277 — fix Auth unlink types; Worker SCREEN_MAP 11 camera |
| **Branch / worktree** | `fix/mobile-visual-walk` @ `/Users/alex/Projects/AISTROYKA-ios-worker-v4-3` |
| **Runtime** | Production Apple OAuth live. Google button ships after merge/deploy |
| **Next** | Wait for `check` green on PR #277. Remaining owner-gated: SMS OTP Twilio, TestFlight MODE B, live E2E |

## Notes

Draft PR https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/277. `check` failed on `unlinkIdentity({ provider })` vs SDK `UserIdentity`. Unlink now uses `getUser().identities`. Worker resubmit camera uses existing `worker/report/add-media`. Primary checkout was not modified.

---

*Autonomous execution — no stop.*
