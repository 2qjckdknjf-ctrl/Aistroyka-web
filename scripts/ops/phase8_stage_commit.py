#!/usr/bin/env python3
"""Stage Phase 8 release candidate paths explicitly (no git add -A of worktree)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd[:6]), "..." if len(cmd) > 6 else "")
    subprocess.check_call(cmd, cwd=ROOT)


def main() -> int:
    # regenerate manifests
    subprocess.check_call([sys.executable, str(ROOT / "scripts/ops/phase8_commit_manifest.py")], cwd=ROOT)
    files = Path("/tmp/p8-manifest-full.txt").read_text().splitlines()
    # always include execution doc + gitignore + ops helpers
    extra = [
        "docs/roadmap/AISTROYKA_PHASE8_RELEASE_EXECUTION_2026-08-02.md",
        ".gitignore",
        "scripts/ops/phase8_audit_matrix.py",
        "scripts/ops/phase8_classify_worktree.py",
        "scripts/ops/phase8_commit_manifest.py",
        "scripts/ops/phase8_review_cred_source.py",
        "scripts/ops/phase8_stage_commit.py",
    ]
    for e in extra:
        if e not in files and (ROOT / e).exists():
            files.append(e)

    # exclude safety
    deny_sub = (
        "PilotE2ECredentials.swift",
        "ios/Shared/.build/",
        ".env",
        ".open-next/",
        "/.next/",
    )
    filtered = []
    for f in files:
        if any(d in f for d in deny_sub):
            print("SKIP", f)
            continue
        if not (ROOT / f).exists() and f not in {"docs/roadmap/AISTROYKA_PHASE8_RELEASE_EXECUTION_2026-08-02.md"}:
            # deleted tracked files may still need staging via status
            pass
        filtered.append(f)

    # stage in chunks
    chunk = 100
    for i in range(0, len(filtered), chunk):
        batch = filtered[i : i + chunk]
        run(["git", "add", "-A", "--", *batch])

    # show staged summary
    out = subprocess.check_output(["git", "diff", "--cached", "--name-only"], cwd=ROOT, text=True)
    staged = [ln for ln in out.splitlines() if ln.strip()]
    print(f"staged_count={len(staged)}")
    bad = [p for p in staged if any(x in p for x in ("PilotE2ECredentials", ".env.local", ".p8", ".jks"))]
    build_kept = [p for p in staged if "ios/Shared/.build/" in p and not p.startswith("D\t") and True]
    # deletions of .build are OK (from git rm --cached)
    print(f"bad_staged={len(bad)}")
    for p in bad:
        print("BAD", p)
    build_paths = [p for p in staged if "ios/Shared/.build/" in p]
    print(f"build_index_paths={len(build_paths)} (expect deletions only)")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
