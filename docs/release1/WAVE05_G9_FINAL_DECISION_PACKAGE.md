# Wave 0.5 — G9 final decision package (leadership review)

**Date:** 2026-03-26 (UTC)  
**Status:** **DRAFT for approval** — not a silent scope change. Product leadership must confirm or edit statuses.

---

## Decision template per item

For each row: **REQUIRED IN R1** | **DEFER WITH WAIVER** | **OUT OF R1**

---

### 1. Photo proof (attach before submit)

| Dimension | Content |
|-----------|---------|
| **Web/API** | Media upload sessions + report add-media + submit — **mature** |
| **iOS Worker** | Still-image pipeline — **mature** (per prior audits) |
| **Android Worker** | Photo pipeline + submit — **mature**; **release** enforces attach gate |
| **R1 value** | Core operating truth |
| **R1 risk** | Low if proof uses **release** or `pilotRealSubmit` debug |
| **If excluded** | Cannot claim Worker proof-of-work |
| **Recommended** | **REQUIRED IN R1** |

---

### 2. Text comment (Worker free-text on report)

| Dimension | Content |
|-----------|---------|
| **Web/API** | Docs (`FIRST_CLIENT_SCOPE_LOCK.md`): **no** dedicated worker comment field in inspected domain |
| **iOS / Android** | **No** comment UI found in Wave 0.5 inspection |
| **R1 value** | Clarifies site conditions without photos |
| **R1 risk** | **Medium** — needs **DB + API + 4 clients** |
| **If excluded** | Proof limited to media + status |
| **Recommended** | **REQUIRED IN R1** **unless** leadership accepts **DEFER WITH WAIVER** with written operational workaround (e.g. manager notes only) |

---

### 3. Tri-state: done / partial / blocker

| Dimension | Content |
|-----------|---------|
| **Web/API** | Task/report **status** fields exist in domain — exact tri-state UX **not** fully inventoried in Wave 0.5 |
| **Mobile** | **No** dedicated tri-state control found in Worker UI grep |
| **R1 value** | Honest field progress |
| **R1 risk** | Medium — align DB + mobile + manager |
| **If excluded** | Binary completion only |
| **Recommended** | **DEFER WITH WAIVER** **or** **REQUIRED IN R1** — leadership must choose; **default quality stance:** **REQUIRED IN R1** for Operating Truth Platform |

---

### 4. Video

| Dimension | Content |
|-----------|---------|
| **Web/API** | Finalize supports mime/size — no Worker-specific block in types |
| **iOS** | JPEG/still path — **no** video capture in Worker |
| **Android** | **No** video in Worker `.kt` tree |
| **R1 value** | High for some sites; **not** in minimal contour |
| **R1 risk** | **High** (bandwidth, storage, UX) |
| **If excluded** | Photo-only Worker proof |
| **Recommended** | **OUT OF R1** **or** **DEFER WITH WAIVER** — **not** **REQUIRED IN R1** unless contract mandates |

---

### 5. Voice note

| Dimension | Content |
|-----------|---------|
| **Web/API** | No Worker voice field evidenced |
| **iOS / Android** | **Absent** |
| **R1 value** | Convenience |
| **R1 risk** | **High** (privacy, permissions, storage) |
| **If excluded** | Text/photo only |
| **Recommended** | **OUT OF R1** **or** **DEFER WITH WAIVER** |

---

## Waiver language (template)

> For Release 1, **[video / voice / text comment / tri-state]** is **deferred**. Operating proof will rely on **[photo + submit]** and **[manager review]** only. We accept **[operational consequence]**. Deferred items are tracked for **[R1.x / R2]** with no implied parity claim.

---

## Sign-off block (manual)

| Role | Name | Date | Approved scope |
|------|------|------|----------------|
| Product | | | |
| Engineering | | | |
