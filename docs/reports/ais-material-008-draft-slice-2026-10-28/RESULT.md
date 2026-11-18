# AIS-MATERIAL-008 material requirement draft — closure

**Verdict:** YES (draft-only requirement + dated supplier quote compare; no order/pay/message)

## Delivered
- `material_requirement_drafts` + `material_supplier_quote_drafts` (internal RLS)
- `POST .../acceptances/:id/material-requirement-draft` (accepted quantity only)
- `POST .../materials/requirement-drafts/:id/quotes` (stock defaults `unknown`)
- Pure `materialRequirement` reused; lite clients blocked

## Finance boundary
- Contractor-internal only; not portal/share
- Supplier unit prices are quote drafts for comparison — no markup/margin/profitability fields
- Unknown stock must not imply available

## Checks
- vitest material-requirement-draft: PASS (6)
- tsc / eslint / Aikido: PASS

## Remaining
- Manager UI for drafts; live supplier Search & Fetch baseline; no marketplace
- OWNER_GATE legal/store/billing unchanged
