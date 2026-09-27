# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-09-27  
**Updated by:** public claim remediation on production (PR #354 and follow-up)

---

## Now

| Field | Value |
|---|---|
| **Active slice** | Public claim tails — controlled-pilot wording on marketing pages |
| **Live artifact** | sha7 `883c000` on staging + prod (MATCH) at follow-up start; this docs/copy change deploys after merge |
| **Branch tip** | `main` @ `883c000` before this follow-up |
| **Pilot scope** | **contractor-ops-only** — NOT FULL / NOT portal |
| **Runtime** | Auth: email, Apple, Google, QR. Telegram login is hidden unless a bot username is configured. Phone OTP hidden. Twilio is not a launch gate. |
| **Next** | Counsel-approved privacy/terms stay **BLOCKED_EXTERNAL**. Do not invent legal text or growth baselines. |
| **Closed** | PR #354 public copy on production; contractor-ops READY 2026-09-14 remains the product-scope freeze |

## Not approved / forbidden claims

- **Not approved:** stakeholder / client **portal READY**
- **Not approved:** **FULL** (contractor + portal) pilot READY
- **Not approved:** Public GA, GDPR certification, App Store / Google Play availability
- **Not approved:** marketing AI analysis, Telegram login, or unverified KPI numbers as live facts
- Re-widen to FULL only with explicit Sasha/Commander decision + stakeholder smoke

## Notes

Deploy SoT: Cloudflare Workers (Vercel = preview only). Docs-only merges: prefer `[skip-staging-deploy]` in the commit message. This follow-up changes public copy, so staging deploy is expected.

---
