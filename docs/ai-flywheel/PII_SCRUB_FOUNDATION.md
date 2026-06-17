# PII Scrub Foundation

**Date:** 2026-06-17

## What is scrubbed

| Type | Pattern | Replacement |
|------|---------|-------------|
| Email | RFC-like local@domain | `[REDACTED_EMAIL]` |
| Phone | International/national digit groups | `[REDACTED_PHONE]` |
| IBAN | ISO 13616-like | `[REDACTED_IBAN]` |
| Bank card | 16-digit groups | `[REDACTED_BANK]` |
| Tax/company IDs | NIF/NIE/CIF, TIN/VAT labels | `[REDACTED_TAX_ID]` |
| Cadastral (ES) | 14-char cadastral ref | `[REDACTED_CADASTRAL]` |
| Address | Street/calle/avenue patterns | `[REDACTED_ADDRESS]` |
| Dictionary terms | Tenant/project names (optional) | `[REDACTED_NAME]` |

## What is not yet fully solved

- Context-aware name disambiguation (common words vs person names)
- Deep nested document structures / PDF text
- Image pixels, EXIF, geodata — **never exported** (out of scope; blocked by policy)
- Audio transcripts without pre-scrub
- Multi-language address variants beyond ES/EN heuristics

## Spain-specific TODOs

- [ ] NIE format edge cases (leading X/Y/Z)
- [ ] CIF control digit validation before redact
- [ ] Full IBAN checksum validation
- [ ] Cadastral reference in prose (not only isolated tokens)
- [ ] Spanish address formats (urbanización, polígono, km markers)

## Modules

| Module | Path |
|--------|------|
| Scrub | `apps/web/lib/platform/ai-flywheel/pii-scrub.ts` |
| Verifier | `apps/web/lib/platform/ai-flywheel/pii-scrub-verifier.ts` |
| CLI scrub | `scripts/ai/scrub.ts` |
| CLI verifier | `scripts/ai/scrub-verifier.ts` |

## Test corpus location

- `apps/web/lib/platform/ai-flywheel/pii-scrub.test.ts` — seeded email/phone/bank/address examples
- Verifier catches deliberately unsanitized output in same file

## Rules

- Scrub before export
- Verifier re-scans output; failed examples **dropped**
- No raw private data in logs
