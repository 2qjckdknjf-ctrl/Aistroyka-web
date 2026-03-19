# B4 — Post-audit — Aistroyka

**Date:** 2026-03-16

---

## 1. Product naming normalization

- **PARTIAL**  
- Canonical prose (**Aistroyka**, **aistroyka.ai**) fixed on authoritative map, B4 set, two phase reports, ADR wording; many archived reports still use **AISTROYKA** / mixed casing by design.

---

## 2. Mobile naming normalization

- **PARTIAL**  
- Release matrix and legacy iOS report banner align with **AiStroykaManager** / **AiStroykaWorker**; archive docs under `docs/worker-lite/` and phase-7 titles still say Worker Lite **as historical record**.

---

## 3. Package naming truthfulness

- **FULL** (for stated scope)  
- **@aistroyka/api-client** description + README + map = optional SDK, not web runtime.

---

## 4. Legacy naming containment

- **PARTIAL**  
- Legacy explicitly labeled on key surfaces; bulk rename of archive titles deferred.

---

## 5. B5 readiness

- **Is repo naming clean enough for B5 validation + post-audit?** **YES**  
- Canonical decisions documented; misleading high-trust drift reduced; no risky runtime renames.

---

## Remaining priorities

| Priority | Item |
|----------|------|
| P1 | Optional pass over remaining audit/report titles (AISTROYKA → Aistroyka where editing anyway). |
| P2 | Root/apps/web `package.json` `name` alignment — needs lockfile/CI audit if ever done. |
| P2 | Native bundle/display strings — outside B4 doc-only scope. |

---

## Blockers

- None for closing B4 as a governance milestone.
