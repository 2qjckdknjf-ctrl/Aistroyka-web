# G9 — Final product decision (APPROVED)

**Status:** **BINDING** for Release 1 scope.  
**Effective:** recorded 2026-03-26 (UTC).

---

## Decision table

| Item | Final status |
|------|----------------|
| **Photo proof** | **REQUIRED IN R1** |
| **Text comment** | **DEFERRED WITH APPROVED WAIVER** |
| **Tri-state (done / partial / blocker)** | **DEFERRED WITH APPROVED WAIVER** |
| **Video** | **OUT OF R1** |
| **Voice note** | **OUT OF R1** |

---

## Reason (product)

Release 1 prioritizes **production-grade stability** across Web, iOS, and Android.

- **Photo proof** remains **mandatory** as the primary field evidence mechanism.
- **Text comment** and **tri-state** are **deferred by approved waiver** to reduce launch risk and avoid destabilizing multi-platform execution.
- **Video** and **voice note** are **explicitly out of Release 1** due to higher complexity and lower launch-critical value.

---

## Execution gate (non-negotiable)

**Wave 1 may proceed only after** production smoke shows **`GET /api/v1/ops/metrics` → HTTP 200** with proper auth context (see `scripts/smoke/pilot_launch.sh` and `docs/release1/WAVE07_PRODUCTION_SMOKE_FINAL.md`).

G9 scope approval **does not** replace the **ops/metrics** smoke gate.

---

## Supersedes

- Prior “G9 not closed” statements in `docs/release1/WAVE07_G9_FINAL_SIGNOFF.md` for **scope items** above — **this file** is the **authoritative** product sign-off for G9.

**Note:** Attach formal stakeholder names/dates in your process tracker if required; this document captures the **approved decision content** as given.
