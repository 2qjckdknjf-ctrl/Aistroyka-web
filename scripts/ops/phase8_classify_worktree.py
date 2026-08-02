#!/usr/bin/env python3
"""Sanitized worktree classification for Phase 8 operator batch (names only)."""
from __future__ import annotations

import subprocess
from collections import Counter, defaultdict
from pathlib import Path


def porcelain() -> list[tuple[str, str]]:
    out = subprocess.check_output(["git", "status", "--porcelain"], text=True)
    rows: list[tuple[str, str]] = []
    for line in out.splitlines():
        st, rest = line[:2], line[3:]
        path = rest.split(" -> ", 1)[-1].strip().strip('"')
        rows.append((st, path))
    return rows


def classify(path: str) -> str:
    pl = path.lower()
    name = Path(path).name.lower()
    if name.startswith(".env") and not name.endswith(".example") and "example" not in name:
        return "SECRET_ENV"
    secret_markers = [
        "secrets.xcconfig",
        ".p8",
        "authkey_",
        ".jks",
        "keystore.properties",
        "service-account",
        "google-play",
        ".secrets/",
        "local-secrets/",
        "pilot-intake.real.local",
        "uitest-e2e-credentials",
    ]
    if any(m in pl for m in secret_markers) and "example" not in name:
        return "SECRET_CRED"
    if "pilote2ecredentials.swift" in pl:
        return "REVIEW_CRED_SOURCE"
    if any(
        x in pl
        for x in [
            "/.next/",
            ".open-next/",
            "/node_modules/",
            ".gradle/",
            "deriveddata",
            "xcuserdata",
            "/.build/",
            "/dist/",
            "tsbuildinfo",
            ".turbo/",
        ]
    ):
        return "GENERATED"
    if name.endswith(".log") or "/logs/" in pl:
        return "LOG_MEDIA"
    if pl in {
        "agents.md",
        "status.md",
        "project_context.md",
        ".gitignore",
        "package.json",
        "bun.lock",
        "package-lock.json",
    }:
        return "EXPECTED_PRODUCT"
    expected_prefixes = (
        "apps/web/",
        "android/",
        "ios/",
        "packages/",
        "docs/",
        "scripts/",
        ".github/",
        ".cursor/",
    )
    if any(pl.startswith(x) for x in expected_prefixes):
        return "EXPECTED_PRODUCT"
    return "UNKNOWN"


def main() -> None:
    rows = porcelain()
    counts: Counter[str] = Counter()
    buckets: dict[str, list[str]] = defaultdict(list)
    for st, path in rows:
        kind = classify(path)
        counts[kind] += 1
        if len(buckets[kind]) < 40:
            buckets[kind].append(f"{st} {path}")

    print(f"PORCELAIN_TOTAL={len(rows)}")
    for k, v in counts.most_common():
        print(f"{k}={v}")
    for k in [
        "UNKNOWN",
        "SECRET_ENV",
        "SECRET_CRED",
        "REVIEW_CRED_SOURCE",
        "GENERATED",
        "LOG_MEDIA",
    ]:
        print(f"\nSAMPLE_{k}")
        for s in buckets.get(k, []):
            print(s)

    markers = (
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
    )
    phase8 = sorted({p for _, p in rows if any(m.lower() in p.lower() for m in markers)})
    print(f"\nPHASE8_SCOPED_COUNT={len(phase8)}")
    for p in phase8:
        print(p)


if __name__ == "__main__":
    main()
