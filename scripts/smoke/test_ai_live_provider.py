"""Hermetic deployment-proof checks: a direct provider cannot hide an app failure."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("ai_live_provider.sh")


class DeploymentProofTests(unittest.TestCase):
    def probe(self, mode):
        with tempfile.TemporaryDirectory() as tmp:
            curl = Path(tmp) / "curl"
            curl.write_text(f"#!{sys.executable}\n" + '''
import json, os, pathlib, sys
a = sys.argv[1:]
if any("api.openai.com" in x for x in a):
    pathlib.Path(os.environ["DIRECT_SENTINEL"]).write_text("called")
    sys.exit(7)
if any("/health" in x for x in a):
    print('{"openaiConfigured":true}')
    sys.exit(0)
mode = os.environ["PROBE_MODE"]
body = {"stage":"foundation", "completion_percent":20, "risk_level":"low", "detected_issues":[], "recommendations":[]}
if mode == "invalid": body = {"stage":"foundation", "risk_level":"low"}
pathlib.Path(a[a.index("-o")+1]).write_text(json.dumps(body))
pathlib.Path(a[a.index("-D")+1]).write_text("x-ai-fallback-reason: provider_unavailable\\r\\n" if mode == "fallback" else "")
print("401" if mode == "unauthorized" else "503" if mode == "unavailable" else "200", end="")
''')
            curl.chmod(0o700)
            sentinel = Path(tmp) / "direct"
            env = {**os.environ, "PATH": tmp + os.pathsep + os.environ["PATH"],
                   "AUTH_HEADER": "Bearer hermetic-test", "BASE_URL": "https://test.invalid",
                   "OPENAI_API_KEY": "hermetic-test", "AI_ALLOW_DIRECT_PROBE": "1",
                   "DIRECT_SENTINEL": str(sentinel), "PROBE_MODE": mode}
            result = subprocess.run(["bash", str(SCRIPT), "--require-live"], env=env,
                                    text=True, capture_output=True, timeout=20)
            self.assertFalse(sentinel.exists(), "strict app proof must not call a direct provider")
            return result.returncode, json.loads(result.stdout)

    def test_authenticated_app_response_is_proof(self):
        code, summary = self.probe("success")
        self.assertEqual(code, 0)
        self.assertTrue(summary["live_provider_call_succeeded"])
        self.assertEqual(summary["fallback_count"], 0)

    def test_auth_failure_cannot_be_masked(self):
        code, summary = self.probe("unauthorized")
        self.assertEqual(code, 1)
        self.assertEqual(summary["error_kind"], "http_401")

    def test_app_unavailable_cannot_be_masked(self):
        self.assertEqual(self.probe("unavailable")[0], 1)

    def test_deterministic_fallback_is_not_live_proof(self):
        self.assertEqual(self.probe("fallback")[0], 1)

    def test_invalid_response_is_not_live_proof(self):
        self.assertEqual(self.probe("invalid")[0], 1)


if __name__ == "__main__":
    unittest.main()
