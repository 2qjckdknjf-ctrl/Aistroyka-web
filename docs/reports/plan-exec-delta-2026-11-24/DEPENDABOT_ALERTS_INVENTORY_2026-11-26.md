# Dependabot alerts inventory — 2026-11-26

Alerts enabled earlier today. Counts via GitHub API `dependabot/alerts?state=open`.

| Severity | Count |
|---|---|
| critical | 1 |
| high | 46 |
| medium | 30 |
| low | 14 |

## Critical

| # | Package | GHSA | Manifest | Note |
|---|---|---|---|---|
| 77 | `proxy-addr` | GHSA-jqcg-44mw-7w3h | root `package-lock.json` | Fix ≥2.0.8; Vercel npm lock only (Bun `bun.lock` is canonical app lock) |

## High (selected)

| Package | Notes |
|---|---|
| `zod` | GHSA-mrhx-c7xc-m3w5 — patched in **4.6.6+**; repo on `^3.23.8` → **major**, dedicated PR + contract tests, not this slice |
| `undici` | Multiple lock entries under root `package-lock.json` |

## Policy

- No blind major bumps (zod 3→4, AGP majors, etc.).
- Prefer small lockfile patches for critical transitive npm-preview deps (`proxy-addr`) in a focused follow-up PR.
- Open Dependabot PR #530 (Bun lock) remains separate review.
