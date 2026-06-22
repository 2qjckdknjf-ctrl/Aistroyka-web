# GH Repair Diagnostics — 2026-06-20

## Broken `gh`
- Path: `/usr/local/bin/gh`
- Runtime error: `bad CPU type in executable`
- Architecture: `Mach-O 64-bit executable x86_64`

## Machine
- CPU architecture: `arm64`

## Homebrew
- `/opt/homebrew/bin/brew`: missing
- `/usr/local/bin/brew`: present, `Homebrew 6.0.2`

## Diagnosis
- The default `gh` binary is x86_64 and cannot execute on this arm64 macOS environment.
- A user-local arm64 `gh` install was chosen instead of modifying `/usr/local/bin/gh`, using sudo, or changing shell profiles.
