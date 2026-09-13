# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-09-13  
**Updated by:** docs — STATUS refresh to hardening candidate (Grow OS TASK-AISTROYKA-002)

---

## Now

| Field | Value |
|---|---|
| **Active slice** | Hardening candidate on main `d95abdb` — pilot baseline validation (TASK-AISTROYKA-002) |
| **Branch** | `main` @ `d95abdbb934f8ea1ba9407a655ad72fdea6b5fe3` |
| **Staging** | sha7 `d95abdb` MATCH (live health) |
| **Prod** | sha7 `d95abdb` MATCH (live health) — no new deploy requested |
| **Pilot scope** | FULL (contractor + portal) |
| **Runtime** | Auth: email, Apple, Google, QR, Telegram where enabled. Phone OTP hidden/disabled. Twilio is not a launch gate. |
| **Next** | Interactive auth + portal/finance smoke (APR-AISTROYKA-001 credentials); CI Check evidence on HEAD; keep entitlement account-first OFF |
| **Closed** | PR #277 merged 2026-08-31 |

## Notes

Deploy SoT: Cloudflare Workers (Vercel = preview only). STATUS was stale vs main since 2026-08-31; this refresh aligns docs to live HEAD.

---
