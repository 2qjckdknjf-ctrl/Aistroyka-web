# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-08-31  
**Updated by:** Phone OTP disabled-optional; Twilio not a launch gate

---

## Now

| Field | Value |
|---|---|
| **Active slice** | PR #277 — phone OTP hidden/disabled; Twilio not required |
| **Branch / worktree** | `fix/mobile-visual-walk` @ `/Users/alex/Projects/AISTROYKA-ios-worker-v4-3` |
| **Runtime** | Auth: email, Apple, Google, QR, Telegram where enabled. Phone OTP is optional and disabled (`external_phone_enabled=false`). |
| **Next** | Land phone-OTP cleanup on PR #277 (`check` was green on prior SHA). Remaining owner-gated: TestFlight MODE B, live E2E. Twilio is **not** a blocker. |

## Notes

Draft PR https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/277. Worker login no longer shows phone OTP unless `AISTROYKA_PHONE_OTP=1`. Live Auth phone flag is off; no Twilio credentials were added. Primary checkout was not modified.

---

*Autonomous execution — no stop.*
