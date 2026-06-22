# GitHub CLI Recovery — 2026-06-20

## Attempted Recovery
- No reinstall attempted.

## Reason
- Safe preferred path would be arm64 Homebrew at `/opt/homebrew/bin/brew`.
- `/opt/homebrew/bin/brew` is not present.
- Existing Homebrew is under `/usr/local/bin`, matching the broken x86_64 `gh` install path.
- No `sudo` or shell profile mutation was attempted.

## Final `gh` Status
- Usable: NO.
- Final path: `/usr/local/bin/gh`.
- Failure: `bad CPU type in executable`.

## Next Safe Recovery
- Install arm64 GitHub CLI via arm64 Homebrew or another approved package source outside this automation step.
