# Toolchain Recovery Report — 2026-06-20

## Root Cause
Volta was resolving `node` to an installed Node image built for `x86_64`:

```text
/Users/alex/.volta/tools/image/node/22.22.2/bin/node: Mach-O 64-bit executable x86_64
bad CPU type in executable
```

The host is `arm64`, so Node and npm failed before install/build scripts could run.

## Commands Run
- `volta install node@22`
- `node -v`
- `npm -v`
- `bun -v`
- `bun install --frozen-lockfile`
- validation commands listed in `VALIDATION_BASELINE_AFTER_TOOLCHAIN_2026-06-20.md`

## Final Tool Versions
- Node: `v22.23.0`
- Node image path: `/Users/alex/.volta/tools/image/node/22.23.0/bin/node`
- Node image architecture: `Mach-O 64-bit executable arm64`
- npm: `10.9.8`
- Bun: `1.2.15`
- Volta: `2.0.2`

## Install Result
- `bun install --frozen-lockfile`: PASS.
- Prior blocker is resolved.

## Repo File Changes
- No repo changes were required to fix the toolchain.
- During later validation, `package-lock.json` received an install metadata side effect adding the existing root `engines` block.
- That lockfile side effect was inspected and reverted immediately.

## Lockfiles Changed
- Final state: NO.
- Lockfile diff after cleanup: none.

## Recovery Verdict
- Toolchain recovered safely.
- No dependency version changes.
- No package.json changes.
- No committed toolchain-specific repo changes.
