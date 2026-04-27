# Closure Sprint A — Architecture drift post-audit

**Project:** Aistroyka  
**Date:** 2026-03-23  
**Inputs:** [`CLOSURE_A_ARCH_DRIFT_INVENTORY.md`](./CLOSURE_A_ARCH_DRIFT_INVENTORY.md), [`CLOSURE_A_ARCH_DRIFT_REMEDIATION.md`](./CLOSURE_A_ARCH_DRIFT_REMEDIATION.md)  

---

## 1. Inspected

- Root vs `apps/web` middleware, `lib/`, `components/`
- API layout (`/api/v1` vs legacy `/api/*`)
- Supabase helper duplication paths
- Bun vs npm script split (CI vs Vercel)
- Documents domain and API filenames (inventory level)

---

## 2. Incomplete

- Exhaustive grep for **any** import path reaching **root** `lib/` from non-`apps/web` packages (mobile/scripts) — not run to completion in this slice
- Full **documents/approvals** E2E and entitlement matrix vs code
- OpenAPI / contracts coverage vs actual route count

---

## 3. Changed

- Closure A arch drift markdown deliverables added under `docs/final/`.
- [`lib/README.md`](../../lib/README.md) — явная пометка legacy-корневого `lib/` и ссылка на closure-документы.
- В [`CLOSURE_A_ARCH_DRIFT_INVENTORY.md`](./CLOSURE_A_ARCH_DRIFT_INVENTORY.md) добавлен раздел **«Канон импортов (apps/web)»** (алиас `@/*`, отсутствие относительных импортов в корневой `lib/`).

---

## 4. Validated (repo-level)

- **Canonical web app** is `apps/web` for production CI.
- **Legacy root artifacts** are identified and consistent with Phase 0 architecture map.
- **Remediation** plan stays **non-destructive**.

---

## 5. Blocked

- None for documentation.

---

## Phase comment (Workstream B + D inventory)

- **inspected:** structural drift inventory  
- **incomplete:** deep consumer grep; full documents QA  
- **changed:** docs only  
- **validated:** canonical app path = `apps/web` (yes)  
- **blocked:** n/a  
- **verdict:** **YES** for *clarity of drift*; **NO** for *full product closure* of documents workflow (see Workstream D in inventory)  
