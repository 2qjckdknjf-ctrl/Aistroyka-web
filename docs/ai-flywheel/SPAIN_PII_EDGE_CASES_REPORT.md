# Spain PII Edge Cases Report

**Date:** 2026-06-17

## Coverage added

| Category | Examples tested | Placeholder |
|----------|-----------------|-------------|
| NIE | `X1234567L` | `{TAX_ID}` |
| NIF | `12345678Z` | `{TAX_ID}` |
| CIF | `B12345678` | `{TAX_ID}` |
| Spanish IBAN | `ES91 2100...` | `{BANK_DETAIL}` |
| Mobile | `+34 612 345 678`, `600 000 000` | `{PHONE}` |
| Landline | `93 000 00 00` | `{PHONE}` |
| Email | standard RFC-like | `{EMAIL}` |
| Cadastral | `1234567AB1234D` | `{CADASTRAL}` |
| Address | Calle, Carrer, Av., Passeig, Plaza | `{ADDRESS}` |
| Postal | `CP 08001` + contextual standalone | `{POSTAL_CODE}` |
| Company | `S.L.U.`, Sociedad Limitada | `{COMPANY}` |
| Autónomo | standalone token | `{COMPANY}` |
| Social | WhatsApp, Telegram handles | `{SOCIAL_HANDLE}` |
| Bank card | 16-digit groups | `{BANK_DETAIL}` |

## Test corpus

`apps/web/lib/platform/ai-flywheel/spain-pii.test.ts` — 23 tests

## Verifier

`pii-scrub-verifier.ts` re-scans for raw patterns; failed examples dropped from export.

## Limitations (honest)

- Name disambiguation (e.g. common surnames) not solved
- IBAN checksum not validated before redaction
- CIF/NIE control-digit validation not implemented
- Standalone 5-digit postal codes only scrubbed near address keywords (false-positive guard)
- PDF/OCR/EXIF/media pixels out of scope

## False-positive guard

Generic project codes (e.g. `Milestone M-104`) pass scrub + verify.
