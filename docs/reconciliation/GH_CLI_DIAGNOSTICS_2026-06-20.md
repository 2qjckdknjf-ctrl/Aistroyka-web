# GitHub CLI Diagnostics — 2026-06-20

## CPU Architecture
- `uname -m`: `arm64`

## `gh`
- Path: `/usr/local/bin/gh`
- Execution result: `bad CPU type in executable`
- File architecture:
  - `Mach-O 64-bit executable x86_64`

## Homebrew
- `command -v brew`: `/usr/local/bin/brew`
- `/opt/homebrew/bin/brew`: missing
- `/usr/local/bin/brew --version`: `Homebrew 6.0.2`

## Diagnosis
- Local GitHub CLI is an x86_64 binary on an arm64 machine.
- arm64 Homebrew is not available at `/opt/homebrew/bin/brew`.
- Reinstalling with `/usr/local/bin/brew` is not the preferred safe arm64 recovery path and was not attempted.
