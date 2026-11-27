#!/usr/bin/env python3
"""Keep live config and log paths covered by the actual Gitleaks scanner."""

import argparse
import json
from pathlib import Path
import secrets
import string
import subprocess
import tempfile


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gitleaks", default="gitleaks")
    args = parser.parse_args()
    config = Path(__file__).resolve().parents[2] / ".gitleaks.toml"
    expected = {
        "control/config.txt",
        "ios/Config/Secrets.xcconfig",
        "TestLogs/runtime.log",
        "engine/Aistroyk/config.txt",
    }
    with tempfile.TemporaryDirectory(prefix="gitleaks-live-paths-") as temporary:
        root = Path(temporary)
        source = root / "source"
        for name in expected:
            path = source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            # Generate nonfunctional token-shaped fixtures; never use live credentials.
            token = "gh" + "p_" + "".join(
                secrets.choice(string.ascii_letters + string.digits) for _ in range(36)
            )
            path.write_text(f'token = "{token}"\n', encoding="utf-8")
        report = root / "report.json"
        result = subprocess.run(
            [args.gitleaks, "detect", "--no-git", "--source", str(source),
             "--config", str(config), "--redact", "--report-format", "json",
             "--report-path", str(report), "--exit-code", "1"],
            capture_output=True, text=True, check=False,
        )
        findings = json.loads(report.read_text(encoding="utf-8")) if report.exists() else []
        detected = set()
        for finding in findings:
            path = Path(finding["File"])
            detected.add(path.relative_to(source).as_posix() if path.is_absolute() else path.as_posix())
        if result.returncode != 1 or detected != expected:
            # Report only paths and status, never secret values or raw scan output.
            raise SystemExit(
                f"FAIL: scanner exit={result.returncode}; missing={sorted(expected - detected)}; "
                f"unexpected={sorted(detected - expected)}"
            )
        print(f"PASS: Gitleaks detects synthetic credentials in all {len(expected)} paths")


if __name__ == "__main__":
    main()
