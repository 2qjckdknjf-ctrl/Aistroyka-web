# Toolchain Diagnostics — 2026-06-20

## Host Architecture
- `uname -m`: `arm64`
- `arch`: `arm64`
- Kernel: Darwin 25.5.0 arm64

## Tool Paths And Versions Before Recovery
- `node`: `/Users/alex/.volta/bin/node`
- `node -v`: failed through Volta with `Bad CPU type in executable`
- `npm`: `/Users/alex/.volta/bin/npm`
- `npm -v`: failed because `node` could not execute
- `bun`: `/Users/alex/.bun/bin/bun`
- `bun -v`: `1.2.15`
- `volta`: `/Users/alex/.volta/bin/volta`
- `volta --version`: `2.0.2`

## Binary Architecture
- Volta shim: universal binary with `x86_64` and `arm64` slices.
- Bun binary: `Mach-O 64-bit executable arm64`.
- Broken Volta Node image:
  - path: `/Users/alex/.volta/tools/image/node/22.22.2/bin/node`
  - architecture: `Mach-O 64-bit executable x86_64`
  - result on this machine: `bad CPU type in executable`

## Project Toolchain Config
- Root `package.json`:
  - `packageManager`: `bun@1.2.15`
  - engines: `bun: 1.2.15`, `node: >=22.9.0`
- `apps/web/package.json` uses `node` in build/check scripts and postinstall/prepare scripts.
- No repo Volta pin was found in `package.json` or `apps/web/package.json`.

## Diagnosis
- Problem type: local machine/toolchain.
- Root cause: Volta had installed an `x86_64` Node image (`22.22.2`) on an `arm64` Mac.
- Not caused by repo dependencies or product code.
