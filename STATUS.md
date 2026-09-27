# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-09-27  
**Updated by:** fake metric removal on the report review screen and public demo

---

## Now

| Field | Value |
|---|---|
| **Active slice** | Cabinet portfolio panel shows only live risk, progress, and budget — no fixed 60% or “2 projects” |
| **Live artifact** | sha7 `50762c7` on staging + prod (MATCH) before this slice |
| **Branch tip** | `main` @ `eedfdf81` before this slice |
| **Pilot scope** | **contractor-ops-only** — NOT FULL / NOT portal |
| **Runtime** | Auth: email, Apple, Google, QR. Telegram login is hidden unless a bot username is configured. Phone OTP hidden. Twilio is not a launch gate. |
| **Next** | Counsel-approved privacy/terms stay **BLOCKED_EXTERNAL**. Do not invent legal text or growth baselines. |
| **Closed** | PR #354 and PR #355 public copy on production `eedfdf8` |

## Not approved / forbidden claims

- **Not approved:** stakeholder / client **portal READY**
- **Not approved:** **FULL** (contractor + portal) pilot READY
- **Not approved:** Public GA, GDPR certification, App Store / Google Play availability
- **Not approved:** marketing AI analysis, Telegram login, or unverified KPI numbers as live facts
- Re-widen to FULL only with explicit Sasha/Commander decision + stakeholder smoke

## Notes

Deploy SoT: Cloudflare Workers (Vercel = preview only). This slice changes product copy and the report review screen, so a staging deploy is expected.

---
