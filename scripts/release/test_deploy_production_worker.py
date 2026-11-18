"""Exercise the deploy boundary without network access or real credentials."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().with_name("deploy-production-worker.sh")


class DeployBoundaryTests(unittest.TestCase):
    def run_deploy(self, secrets=None, returncode=0, sha="a" * 40):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fake = root / "npx"
            fake.write_text("#!" + sys.executable + "\n" + """
import json, os, pathlib, stat, sys
args = sys.argv[1:]
p = pathlib.Path(args[args.index('--secrets-file') + 1])
pathlib.Path(os.environ['PROBE_RECORD']).write_text(json.dumps({
    'args': args, 'file': str(p), 'mode': stat.S_IMODE(p.stat().st_mode),
    'secrets': json.loads(p.read_text())
}))
sys.exit(int(os.environ['PROBE_EXIT']))
""")
            fake.chmod(0o700)
            env = {**os.environ, "PATH": str(root) + os.pathsep + os.environ["PATH"],
                   "RUNNER_TEMP": str(root), "NEXT_PUBLIC_BUILD_SHA": sha,
                   "NEXT_PUBLIC_BUILD_TIME": "2026-10-11 09:40",
                   "PROBE_RECORD": str(root / "record.json"), "PROBE_EXIT": str(returncode)}
            for name in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY"):
                env.pop(name, None)
            env.update(secrets or {})
            result = subprocess.run(["bash", str(SCRIPT)], env=env, cwd=root,
                                    capture_output=True, text=True)
            record = json.loads((root / "record.json").read_text()) if (root / "record.json").exists() else None
            if record:
                self.assertFalse(Path(record["file"]).exists(), "Secret file must be removed")
            self.assertFalse(list(root.glob("aistroyka-provider-secrets.*")))
            return result, record

    def test_existing_provider_values_use_private_file_and_single_deploy(self):
        secrets = {"OPENAI_API_KEY": "synthetic-openai", "ANTHROPIC_API_KEY": "synthetic-anthropic"}
        result, record = self.run_deploy(secrets)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(record["mode"], 0o600)
        self.assertEqual(record["secrets"], secrets)
        self.assertEqual(record["args"][:3], ["--yes", "wrangler@4.149.0", "deploy"])
        self.assertNotIn("secret", record["args"])
        for value in secrets.values():
            self.assertNotIn(value, result.stdout + result.stderr + json.dumps(record["args"]))

    def test_omitted_provider_bindings_are_not_replaced_by_empty_values(self):
        result, record = self.run_deploy({"OPENAI_API_KEY": "synthetic", "ANTHROPIC_API_KEY": ""})
        self.assertEqual(result.returncode, 0)
        self.assertEqual(record["secrets"], {"OPENAI_API_KEY": "synthetic"})

    def test_no_repository_provider_values_produce_empty_additive_payload(self):
        result, record = self.run_deploy()
        self.assertEqual(result.returncode, 0)
        self.assertEqual(record["secrets"], {})

    def test_failed_deploy_propagates_failure_and_removes_secret_file(self):
        result, _ = self.run_deploy({"OPENAI_API_KEY": "synthetic"}, returncode=17)
        self.assertEqual(result.returncode, 17)

    def test_json_preserves_literal_quotes_newlines_and_dollar_characters(self):
        value = 'synthetic"\n$literal\\value'
        result, record = self.run_deploy({"OPENAI_API_KEY": value})
        self.assertEqual(result.returncode, 0)
        self.assertEqual(record["secrets"]["OPENAI_API_KEY"], value)

    def test_checked_out_source_stamp_is_used_and_invalid_sha_fails_closed(self):
        result, record = self.run_deploy(sha="b" * 40)
        self.assertEqual(result.returncode, 0)
        self.assertIn("NEXT_PUBLIC_BUILD_SHA:" + "b" * 40, record["args"])
        result, record = self.run_deploy(sha="main")
        self.assertEqual(result.returncode, 2)
        self.assertIsNone(record)


if __name__ == "__main__":
    unittest.main()
