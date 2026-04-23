# Wave 4 Step 13 — Handover integration report

## F1–F3. Readiness linkage

- `computeHandoverReadiness` adds a **blocking** blocker when `countBlockingOpen > 0`.  
- Blocker code: `blocking_punch_defects`.  
- `href` points to project overview with **`?tab=defects`** so managers land on the punch list tab.  
- `HandoverManagerPanel` continues to show readiness blockers from the handover API (no separate checklist engine).

## F4. Intentionally not built

- No second parallel checklist product.  
- Existing blockers (milestones, issues, documents, change orders, discussions, requests) unchanged.

## Explainability

- Detail text: open defects marked blocking must be cleared or reclassified (manager can toggle `is_blocking` or close through lifecycle).
