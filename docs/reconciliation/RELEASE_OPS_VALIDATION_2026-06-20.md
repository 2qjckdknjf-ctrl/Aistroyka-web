# Release/Ops Validation — 2026-06-20

## Scope
- Branch: `integration/aistroyka-full-reconciliation-2026-06-20`
- Product/release code ported: NO
- Runtime files changed: NO
- Migrations changed: NO
- Validation need: docs preservation plus release/ops comparison evidence.

## Package Script Inspection
- Root `package.json`: inspected.
- `apps/web/package.json`: inspected.
- Available root scripts include:
  - `build:contracts`
  - `build`
  - `cf:build`
  - `lint`
  - `test`
  - `smoke:pilot`
  - `smoke:pilot:check`
  - `smoke:security-headers`

## Commands Run

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | BLOCKED | Failed during `esbuild` postinstall because Volta could not execute `node`: `Bad CPU type in executable (os error 86)`. |
| `bun run lint` | NOT RUN | Not reached because install failed first. |
| `bun run test -- --run` | NOT RUN | No product/runtime files changed; install blocked before test phase. |
| `bun run build:contracts` | NOT RUN | No contracts changed; install blocked. |
| `bun run build` | NOT RUN | No product/runtime files changed; install blocked. |
| `bun run cf:build` | NOT RUN | No product/runtime files changed; install blocked. |
| `bun run smoke:pilot` | NOT RUN | No product/runtime files changed; live smoke not required for docs-only phase. |
| `bun run smoke:frontend` | UNAVAILABLE | No root script with this exact name was found. |

## Failure Details
Volta log: `/Users/alex/.volta/log/volta-error-2026-06-20_23_47_47.192.log`

```text
"node" "install.js"
Volta v2.0.2
Could not execute command.
Error cause: Bad CPU type in executable (os error 86)
```

## Fix Applied
- No repo fix applied.
- Reason: failure is local toolchain execution (`Volta`/`node`) and not caused by files changed in this phase.

## Final Validation Status
- Git status after blocked install: only `docs/reconciliation/` changed.
- Product validation status: BLOCKED by local toolchain, but no product code was changed.
- Docs-only status: PASS by Git scope review.
