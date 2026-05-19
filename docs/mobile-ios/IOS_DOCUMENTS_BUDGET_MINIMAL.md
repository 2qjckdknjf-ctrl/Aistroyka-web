# iOS — documents & budget minimal (Phase 8)

**Project:** AISTROYKA  
**Date:** 2026-05-19  
**Authority:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` (customer finance isolation)  

## Scope definition (Phase 8)

Phase 8 for **AiStroykaWorker + AiStroykaManager** is **not** “ship a full document management module.” It is:

1. **Explicit product boundary:** what mobile does **not** do today regarding **project documents** and **financial / budget** surfaces.  
2. **Alignment** with **customer finance isolation** — mobile must not become an accidental leak vector for internal contractor economics or customer-inappropriate data.  
3. **Honest inventory** of the only “document-like” flows that exist (report **evidence** / media).

Full **customer-owner** experiences (estimates, approvals, payment schedule when configured) remain **web**-first unless the roadmap adds a dedicated mobile scope later.

---

## Current state — AiStroyka Worker

| Area | Status |
|------|--------|
| Project **file library** (drawings, acts, contracts) | **Not implemented** — out of Worker MVP contour. |
| **Budget / cost / margin** UI | **None** — correct for field-worker role. |
| **Evidence** | Report **photos** via upload pipeline + `file_url` on detail (see `IOS_EVIDENCE_SYSTEM_REPORT.md`). |

Worker API profile **`ios_lite`** is **narrow** by design (`lite-allow-list`); expanding to arbitrary `/api/v1/documents` or finance routes would require deliberate product + security review.

---

## Current state — AiStroyka Manager

| Area | Status |
|------|--------|
| **Documents** tab / project file browser | **Not implemented** in iOS Manager. |
| **Budget, estimates, invoices, internal P&L** | **No** dedicated mobile screens; role gate (`owner` / `admin` / `member`) exists for **access** only, not for surfacing internal finance widgets. |
| **Commercial / customer** artifacts | **Not surfaced** on iOS — web dashboard owns that complexity and isolation rules. |

---

## Customer finance isolation (mobile)

- **Contractor-side apps** (Worker + Manager) are **not** the customer portal.  
- Any future mobile feature that shows **money**, **estimates**, or **schedules** must reuse the same **internal vs customer-facing** split as the web (see mega-roadmap §1).  
- **Phase 8 does not add** customer-facing finance UI on iOS.

---

## Validation

| Check | Result |
|--------|--------|
| Code search: budget/estimate/invoice strings in `ios/AiStroykaManager/**/*.swift` | **No product surfaces** (only generic “owner” role in session) |
| Report media vs project documents | **Separated** in `IOS_EVIDENCE_SYSTEM_REPORT.md` |

---

## Phase 8 closure

### A. PHASE STATUS

**CLOSED** — **scope documented**; **no code change** required for minimal bar (explicit non-scope + isolation note).

### B. CARRY FORWARD (optional P2+)

- If product requires **read-only project documents** on Manager iOS: spec allow-listed `GET` routes, offline policy, and RLS audit **before** implementation.  
- **Customer** mobile app (if ever): separate binary / profile; never mix with `ios_lite` worker allow-list.

### C. NEXT PHASE ALLOWED

**YES** — **Phase 9** (`IOS_E2E_VALIDATION_REPORT.md`) or **Phase 10** prep after E2E logs exist.

---

*End of Phase 8 report.*
