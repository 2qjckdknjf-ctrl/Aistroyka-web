#!/usr/bin/env python3
"""Parse bun audit JSON into a sanitized advisory matrix."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

AUDIT_JSON = Path("/tmp/p8-audit.json")
AUDIT_TXT = Path("/tmp/p8-audit.txt")


def installed_versions(pkg: str, lock: str) -> list[str]:
    vers = set(re.findall(rf'"{re.escape(pkg)}@([^"]+)"', lock))
    # bun.lock sometimes uses pkg@version without quotes nesting
    vers |= set(re.findall(rf"(?:^|[\s\"]){re.escape(pkg)}@([0-9][^\"\s,]*)", lock))
    return sorted(vers)[:12]


def why_lines(pkg: str) -> list[str]:
    try:
        out = subprocess.check_output(
            ["bun", "pm", "ls", pkg],
            text=True,
            stderr=subprocess.STDOUT,
            timeout=45,
        )
    except Exception as exc:  # noqa: BLE001
        return [f"why_failed:{type(exc).__name__}"]
    keep: list[str] = []
    for ln in out.splitlines():
        if any(tok in ln for tok in (pkg, "workspace", "├", "└", "─", "@opennext", "wrangler", "vitest", "eslint", "next-intl", "tailwind")):
            keep.append(ln[:220])
        if len(keep) >= 20:
            break
    return keep or out.splitlines()[:10]


def reachability(pkg: str, why: str) -> str:
    w = why.lower()
    # Dev-only tooling
    if any(x in w for x in ("vitest", "vite ", "eslint", "lint-staged", "tailwindcss")) and "@opennext" not in w and "wrangler" not in w:
        return "DEV_TOOLING_LIKELY"
    if pkg in {"vitest", "vite"}:
        return "DEV_TOOLING"
    if "@opennextjs/cloudflare" in w or "@opennextjs/aws" in w or "wrangler" in w:
        return "PROD_BUILD_RUNTIME_PATH"
    if "next-intl" in w or pkg == "next-intl":
        return "PROD_APP_RUNTIME"
    return "NEEDS_OWNER_REVIEW"


def main() -> None:
    data = json.loads(AUDIT_JSON.read_text())
    lock = Path("bun.lock").read_text(errors="replace") if Path("bun.lock").exists() else ""
    print("AUDIT_PACKAGE_COUNT", len(data))
    for pkg, items in sorted(data.items()):
        if not isinstance(items, list):
            continue
        why = "\n".join(why_lines(pkg))
        reach = reachability(pkg, why)
        print(f"\nPACKAGE {pkg}")
        print("installed", ",".join(installed_versions(pkg, lock)) or "UNKNOWN")
        print("reachability", reach)
        print("why_snippet:")
        for ln in why.splitlines()[:12]:
            print(" ", ln)
        for adv in items:
            sev = adv.get("severity")
            url = adv.get("url")
            title = (adv.get("title") or "")[:140]
            vuln = adv.get("vulnerable_versions")
            print(f"  - severity={sev} vuln={vuln} advisory={url}")
            print(f"    title={title}")

    # summary counts from text
    txt = AUDIT_TXT.read_text() if AUDIT_TXT.exists() else ""
    m = re.search(r"(\d+)\s+vulnerabilit", txt)
    print("\nTEXT_SUMMARY_LINE")
    for ln in txt.splitlines():
        if "vulnerabilit" in ln.lower():
            print(ln)


if __name__ == "__main__":
    main()
