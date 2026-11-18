#!/usr/bin/env python3
"""Read-only guard against replaying source SQL already applied under remote IDs."""
import argparse
import hashlib
import json
from pathlib import Path
import sys


def inspect(repo, receipts, history, candidate=None):
    repo = repo.resolve()
    if not receipts.get("project_ref") or history.get("project_ref") != receipts.get("project_ref"):
        raise ValueError("History project does not match verified receipts")
    if not receipts["receipts"]:
        raise ValueError("No verified receipts supplied")
    remote = {row["version"]: row["name"] for row in history["migrations"]}
    if len(remote) != len(history["migrations"]):
        raise ValueError("Duplicate remote history version")
    sources = {}
    applied_hashes = set()
    versions = set()
    for receipt in receipts["receipts"]:
        version = receipt["remote_version"]
        if version in versions:
            raise ValueError("Duplicate receipt version")
        versions.add(version)
        if remote.get(version) != receipt["remote_name"]:
            raise ValueError("Remote version/name does not match a verified receipt")
        for source in receipt["sources"]:
            path = (repo / source["path"]).resolve()
            if repo not in path.parents or source["path"] in sources:
                raise ValueError("Invalid or duplicate source receipt path")
            if source["path"] != str(path.relative_to(repo)) or path.parent != (repo / "apps/web/supabase/migrations"):
                raise ValueError("Source receipt must use a canonical migration path")
            if hashlib.sha256(path.read_bytes()).hexdigest() != source["sha256"]:
                raise ValueError("Applied source changed; use a new additive migration")
            sources[source["path"]] = version
            applied_hashes.add(source["sha256"])
    report = {"project_ref": receipts["project_ref"], "remote_receipts": len(versions),
              "verified_sources": len(sources), "database_mutated": False,
              "verdict": "VERIFIED_RECEIPTS_DO_NOT_REPLAY"}
    if candidate:
        path = (repo / candidate).resolve()
        migrations = (repo / "apps/web/supabase/migrations").resolve()
        if path.parent != migrations or not path.is_file():
            raise ValueError("Candidate must be an existing repository migration")
        relative = str(path.relative_to(repo.resolve()))
        version = path.name.split("_", 1)[0]
        candidate_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        if relative in sources or version in remote or candidate_hash in applied_hashes:
            report.update(verdict="ALREADY_APPLIED_DO_NOT_REPLAY", candidate=relative)
            return report, 3
        report.update(verdict="CANDIDATE_NOT_PROVEN_APPLIED", candidate=relative,
                      apply_authorized=False)
    return report, 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--history-json", type=Path, required=True,
                        help="Fresh read-only project_ref + migrations metadata export")
    parser.add_argument("--candidate", help="Repository-relative migration path to check")
    parser.add_argument("--bulk-apply", action="store_true",
                        help="Always blocked: receipts do not audit all historical drift")
    args = parser.parse_args()
    try:
        receipts = json.loads((args.repo / "docs/ops/DB_MIGRATION_RECEIPTS_2026-10-11.json").read_text())
        history = json.loads(args.history_json.read_text())
        report, code = inspect(args.repo.resolve(), receipts, history, args.candidate)
        if args.bulk_apply:
            report["verdict"] = "BULK_APPLY_BLOCKED_REQUIRES_FULL_HISTORY_RECONCILIATION"
            code = 3
        print(json.dumps(report, indent=2))
        return code
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"verdict": "STOP_UNVERIFIED_RECEIPTS", "reason": str(error),
                          "database_mutated": False}, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
