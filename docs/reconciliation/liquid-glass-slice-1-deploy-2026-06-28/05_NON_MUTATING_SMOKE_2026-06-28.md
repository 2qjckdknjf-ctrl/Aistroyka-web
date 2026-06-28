# Liquid Glass Slice 1 — Non-Mutating Smoke

Date: 2026-06-28

All checks are read-only HTTP GETs (`curl`, 20–25s timeout). No login, no data creation, no uploads, no submissions.

| URL | Status |
|-----|--------|
| `https://aistroyka.ai/en` | 200 |
| `https://aistroyka.ai/ru` | 200 |
| `https://aistroyka.ai/es` | 200 |
| `https://aistroyka.ai/it` | 200 |
| `https://aistroyka.ai/api/v1/health` | 200 |
| `https://aistroyka.ai/en/login` | 200 |
| `https://aistroyka.ai/effects/glass-filter.svg` | 200 |

## Mutations

- Login performed: NO
- Records created/modified: NO
- Files uploaded: NO
- Reports submitted: NO

Result: **PASS** — all public locale pages and health return 200; no mutations.

Additionally, the production deploy run's blocking **Post-deploy pilot smoke** and **stakeholder finance sanity** gates passed in CI.
