# Wave 0 — G9 worker-scope decision input (no decision taken)

**Date:** 2026-03-26 (UTC)  
**Rule:** This document **prepares** the business decision. **Default:** complete in R1 unless **signed waiver** (`PHASE1_ACCEPTANCE_GATES.md` G9).

---

## 1. Feature-by-feature truth

| Requirement | Web / API | iOS Worker | Android Worker |
|-------------|-----------|------------|----------------|
| **Photo + upload** | `media/upload-sessions`, storage RLS | Before/after still image pipeline, JPEG (`ImagePicker` / queue) | Compose + `WorkerApi` upload session + finalize |
| **Video** | Media finalize accepts mime/size at API level | **No** `video` in Swift Worker sources (grep) — **UIImage → JPEG** path | **No** video keyword in `.kt` Worker tree (grep) |
| **Voice note** | No dedicated Worker voice field found in Wave 0 grep | **Absent** | **Absent** |
| **Text comment** on report | `FIRST_CLIENT_SCOPE_LOCK.md`: no dedicated worker comment field in inspected types | **Absent** in report UI | **Absent** |
| **Tri-state done / partial / blocker** | Task/report domain may have statuses — **verify** `worker_tasks`, `worker_reports` in DB layer | **Not** evidenced as tri-state UX in mobile grep | Same |
| **Earnings light (Worker)** | `GET /api/v1/workers/:userId/summary` exists | **No** earnings UI in iOS Worker | **No** earnings UI in Android Worker |

---

## 2. Completion cost / risk (qualitative)

| Item | Cost | Risk |
|------|------|------|
| **Photo proof without debug bypass (Android)** | Low — use `-PpilotRealSubmit=true` or release build | **Mis-proof** if team uses default debug |
| **Video on mobile** | **High** — capture, encoding, upload size, mime path, UX | Storage + performance + scope |
| **Voice note** | **High** — recording permissions, storage, API field, transcription optional | Product + privacy |
| **Text comment** | **Medium** — schema migration + API + 4 surfaces | Coordinated release |
| **Tri-state** | **Medium** — align task/report states + UI | Domain consistency |
| **Earnings light on Worker** | **Medium** — wire summary API + UI | **API client choice** on summary route must be verified for Bearer |

---

## 3. Waiver implications

If **video** waived: R1 proof uses **photo-only** Worker path; marketing must not promise video.

If **voice** waived: same.

If **text comment** waived: Worker proof is **media-only** + implicit status via submit.

If **tri-state** waived: binary done/not-done only — may conflict with operational truth goals.

**Any waiver** must be **explicit** and **documented** in release notes.

---

## 4. Recommendation (non-binding)

1. **Immediately** require **non-bypass** Worker proof for Android (build flag or release).  
2. **Default R1 completion:** **photo + text comment + tri-state** minimum — requires **schema/API** work if comment/tri-state absent.  
3. **Defer** video/voice to **post-R1** unless business mandates — with **signed** scope addendum.

---

## 5. Status

**G9:** **READY FOR DECISION** — inputs complete; **no** implementation in Wave 0.
