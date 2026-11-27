# GitHub Actions SHA pin inventory — 2026-11-25

Plan item: **Workflow supply chain** (mega-roadmap: PARTIAL → pin third-party actions to immutable SHAs).

## Method

1. Enumerate `uses:` in `.github/workflows/*.yml`.
2. Classify refs as `sha` (40-hex) vs floating `tag` (`vN` / `vN.M`).
3. Resolve current tag tips via GitHub Git Refs API; pin to commit SHA with `# version` comment.

## Result (this PR)

| Before | After |
|---|---|
| 40 floating tag refs / 17 already SHA-pinned | **0 floating tags** in `.github/workflows` |

Pinned this pass (tag tip → SHA):

| Action | Tag | SHA |
|---|---|---|
| `actions/checkout` | v5.1.0 (`v5`) | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |
| `actions/checkout` | v4 | `11d5960a326750d5838078e36cf38b85af677262` |
| `oven-sh/setup-bun` | v2.2.0 (`v2`) | `0c5077e51419868618aeaa5fe8019c62421857d6` |
| `actions/setup-node` | v4 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/upload-artifact` | v4 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| `actions/setup-java` | v4 | `cf277c60eb25467037889841efdb72551f06f6c3` |
| `reactivecircus/android-emulator-runner` | v2 tip | `a421e43855164a8197daf9d8d40fe71c6996bb0d` |

Local reusable workflows (`./.github/workflows/...`) and `${{ }}` expressions unchanged.

## Residuals

- **Dependabot security alerts API**: disabled / needs `admin:repo_hook` — owner enablement (plan P1 supply-chain).
- Major version bumps still require explicit review (existing Dependabot ignore policy).
- Re-run inventory after adding new workflows.
