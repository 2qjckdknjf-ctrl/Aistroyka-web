import copy
import hashlib
from pathlib import Path
import tempfile
import unittest

from migration_receipts_preflight import inspect


class ReceiptGuardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.path = "apps/web/supabase/migrations/20261003170000_intake.sql"
        file = self.repo / self.path
        file.parent.mkdir(parents=True)
        file.write_text("create table synthetic(id int);\n")
        self.receipts = {"project_ref": "synthetic-project", "receipts": [{
            "remote_version": "20261011090316", "remote_name": "intake_atomic",
            "sources": [{"path": self.path, "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}]}]}
        self.history = {"project_ref": "synthetic-project", "migrations": [{
            "version": "20261011090316", "name": "intake_atomic"}]}

    def test_verified_remote_alias_does_not_require_replaying_original_timestamp(self):
        report, code = inspect(self.repo, self.receipts, self.history)
        self.assertEqual(code, 0)
        self.assertEqual(report["verified_sources"], 1)

    def test_receipted_source_candidate_is_blocked_despite_absent_original_version(self):
        report, code = inspect(self.repo, self.receipts, self.history, self.path)
        self.assertEqual(code, 3)
        self.assertEqual(report["verdict"], "ALREADY_APPLIED_DO_NOT_REPLAY")

    def test_changed_applied_sql_is_rejected(self):
        (self.repo / self.path).write_text("drop table synthetic;\n")
        with self.assertRaisesRegex(ValueError, "Applied source changed"):
            inspect(self.repo, self.receipts, self.history)

    def test_exact_sql_copy_with_new_timestamp_is_blocked(self):
        copied = "apps/web/supabase/migrations/20261012000000_copied_intake.sql"
        (self.repo / copied).write_bytes((self.repo / self.path).read_bytes())
        report, code = inspect(self.repo, self.receipts, self.history, copied)
        self.assertEqual(code, 3)
        self.assertEqual(report["verdict"], "ALREADY_APPLIED_DO_NOT_REPLAY")

    def test_missing_or_renamed_remote_entry_is_rejected(self):
        for migrations in [[], [{"version": "20261011090316", "name": "different"}]]:
            with self.assertRaises(ValueError):
                inspect(self.repo, self.receipts, {**self.history, "migrations": migrations})

    def test_wrong_project_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "History project"):
            inspect(self.repo, self.receipts, {**self.history, "project_ref": "other"})

    def test_new_candidate_is_not_a_permission_to_apply(self):
        path = "apps/web/supabase/migrations/20261012000000_new.sql"
        (self.repo / path).write_text("select 1;\n")
        report, code = inspect(self.repo, self.receipts, self.history, path)
        self.assertEqual(code, 0)
        self.assertFalse(report["apply_authorized"])

    def test_duplicate_receipt_or_path_outside_repository_is_rejected(self):
        receipts = copy.deepcopy(self.receipts)
        receipts["receipts"].append(copy.deepcopy(receipts["receipts"][0]))
        with self.assertRaises(ValueError):
            inspect(self.repo, receipts, self.history)
        receipts = copy.deepcopy(self.receipts)
        receipts["receipts"][0]["sources"][0]["path"] = "../outside.sql"
        with self.assertRaises(ValueError):
            inspect(self.repo, receipts, self.history)


if __name__ == "__main__":
    unittest.main()
