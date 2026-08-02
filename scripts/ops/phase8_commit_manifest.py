#!/usr/bin/env python3
"""Build sanitized commit include/exclude manifests for Phase 8 operator batch."""
from __future__ import annotations

import subprocess
from pathlib import Path


def porcelain() -> list[tuple[str, str]]:
    out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
    rows: list[tuple[str, str]] = []
    for line in out.splitlines():
        st, rest = line[:2], line[3:]
        path = rest.split(" -> ", 1)[-1].strip().strip('"')
        rows.append((st, path))
    return rows


def is_generated(path: str) -> bool:
    pl = path.lower()
    return any(
        x in pl
        for x in (
            "ios/shared/.build",
            ".open-next",
            "/.next/",
            "node_modules",
            "tsbuildinfo",
        )
    )


def is_cred_source(path: str) -> bool:
    return "pilote2ecredentials.swift" in path.lower()


PHASE8_MARKERS = (
    "build-stamp",
    "health.stamp",
    "security-headers",
    "worker-bootstrap",
    "security_headers.sh",
    "check-migration",
    "deploy-cloudflare",
    "ci-check.yml",
    "FIRST_72H",
    "PHASE8",
    "PHASE7",
    "DEPLOYMENT_SOURCE_OF_TRUTH",
    "health.schema",
    "deploy-workflow.contract",
    "PHASE3_ROLLBACK",
    "SECURITY_HEADERS_POLICY",
    "phase8_",
    "ai_live_provider",
    "phase7_ai",
    "public.ts",  # getBuildStamp wiring
    "config.test.ts",
    "controllers/health.ts",
)

AUDIT_FILES = {
    "package.json",
    "bun.lock",
    "package-lock.json",
    "apps/web/package.json",
    "packages/contracts/package.json",
    "packages/roma-kernel/package.json",
    ".gitignore",
}


def uniq(xs: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in xs:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def main() -> None:
    rows = porcelain()
    phase8: list[str] = []
    full: list[str] = []
    exclude: list[str] = []
    for _st, path in rows:
        if is_generated(path) or is_cred_source(path):
            exclude.append(path)
            continue
        full.append(path)
        if path in AUDIT_FILES or any(m.lower() in path.lower() for m in PHASE8_MARKERS):
            phase8.append(path)
        if path.endswith("package.json") and (
            path.startswith("apps/") or path.startswith("packages/") or path == "package.json"
        ):
            phase8.append(path)

    phase8 = uniq(phase8)
    full = uniq(full)
    exclude = uniq(exclude)

    Path("/tmp/p8-manifest-phase8.txt").write_text("\n".join(sorted(phase8)) + "\n")
    Path("/tmp/p8-manifest-full.txt").write_text("\n".join(sorted(full)) + "\n")
    Path("/tmp/p8-manifest-exclude.txt").write_text("\n".join(sorted(exclude)) + "\n")
    print(f"phase8_manifest_count={len(phase8)}")
    print(f"full_rc_manifest_count={len(full)}")
    print(f"exclude_count={len(exclude)}")
    print("--- phase8 ---")
    for p in sorted(phase8):
        print(p)
    print("--- exclude sample ---")
    for p in sorted(exclude)[:30]:
        print(p)


if __name__ == "__main__":
    main()
