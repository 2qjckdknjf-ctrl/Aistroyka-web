# Autonomous progress — AISTROYKA

**Updated:** 2026-11-28 (post-merge)  
**Main tip:** `b2929ef55fba2e41d7374b8230a67010dfb3f7b6`  
**Plan ref:** `roadmap/weekly-ai-reconciliation-2026-11-10` § 2026-11-28

## Queue

| ID | Status | Next |
|---|---|---|
| P0 differential replay + projection boundary | MERGED #560 | — |
| P0 portal #533 defects | MERGED via #560 | #533 closed/superseded |
| #530 Dependabot Bun | MERGED `7ffcd0c2` | — |
| P1 GigaAM / d1.3 | RESEARCH_DEFER | Owner license/Silicon/Arena |
| Hosted migrations | OWNER_GATE | Receipts preflight |
| Gemini/ZDR/Mode B/device | OWNER_GATE | Owner secrets/device |

## Checks

- Local vitest 34/34 on pre-merge SHA `1ea4d592`
- Aikido scan_paths: 0 issues
- CI check/gitleaks SUCCESS on #560 before squash merge

## Next concrete step

Owner: run `migration_receipts_preflight.py` against fresh project-scoped export for #553/#554/#556 candidates before any hosted apply.
