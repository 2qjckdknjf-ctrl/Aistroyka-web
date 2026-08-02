#!/usr/bin/env python3
"""Sanitized review of PilotE2ECredentials.swift (no secret values printed)."""
from __future__ import annotations

import re
from pathlib import Path

FILES = [
    "ios/AiStroykaManager/AiStroykaManagerUITests/PilotE2ECredentials.swift",
    "ios/AiStroykaWorker/AiStroykaWorkerUITests/PilotE2ECredentials.swift",
]


def main() -> None:
    for rel in FILES:
        t = Path(rel).read_text(errors="replace")
        print("FILE", rel)
        print("  lines", len(t.splitlines()))
        print("  reads_ProcessInfo", "ProcessInfo" in t)
        print(
            "  reads_env_markers",
            any(x in t for x in ("getenv", "environment", "AISTROYKA_E2E", "AISTROYKA_")),
        )
        print(
            "  hardcoded_email_like",
            bool(re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", t)),
        )
        print(
            "  hardcoded_password_literal",
            bool(re.search(r'(?i)password\s*=\s*"[^"]+"', t)),
        )
        for i, line in enumerate(t.splitlines(), 1):
            if re.search(
                r"\b(struct|enum|static|func|var|let|ProcessInfo|AISTROYKA|TODO|FIXME)\b",
                line,
            ) and '"' not in line:
                print(f"  L{i}: {line[:140]}")


if __name__ == "__main__":
    main()
