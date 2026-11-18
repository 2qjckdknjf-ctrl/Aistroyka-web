"""Exercise the shell gate without network or repository credentials."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[2]


class FinanceShellTests(unittest.TestCase):
    def run_gate(self, status, payload):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative in ('scripts/verify/stakeholder_finance_sanity.sh',
                             'scripts/verify/customer_portal_payload.py',
                             'scripts/smoke/_json_lib.sh'):
                target = root / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(SOURCE / relative, target)
            binary = root / 'bin'
            binary.mkdir()
            temporary = root / 'temporary'
            temporary.mkdir()
            curl = binary / 'curl'
            curl.write_text('#!' + sys.executable + '\n' + '''
import json, os, pathlib, sys
args = sys.argv[1:]
url = next(a for a in args if a.startswith('https://'))
code, body = 200, {}
if url.endswith('/api/auth/login'):
    request = json.loads(pathlib.Path(args[args.index('--data-binary') + 1][1:]).read_text())
    assert request['password'] == os.environ['STAKEHOLDER_SMOKE_PASSWORD']
elif url.endswith('/api/v1/me'):
    body = {'data': {'role': 'stakeholder'}}
elif url.endswith('/portal/projects'):
    body = {'data': [{'id': 'project-a'}]}
elif url.endswith('/costs') or url.endswith('/estimate'):
    code = 403
elif url.endswith('/portal/projects/project-a'):
    code, body = int(os.environ['FIXTURE_STATUS']), json.loads(os.environ['FIXTURE_BODY'])
else:
    raise AssertionError('Unexpected endpoint')
if '-o' in args:
    pathlib.Path(args[args.index('-o') + 1]).write_text(json.dumps(body))
else:
    print(json.dumps(body), end='')
if '-w' in args:
    print(code, end='')
''')
            curl.chmod(0o755)
            env = dict(os.environ, PATH=str(binary) + os.pathsep + os.environ['PATH'],
                       TMPDIR=str(temporary), STAKEHOLDER_FINANCE_BASE_URL='https://fixture.invalid',
                       STAKEHOLDER_SMOKE_EMAIL='fixture@example.invalid',
                       STAKEHOLDER_SMOKE_PASSWORD='fixture"\\secret\nvalue',
                       FIXTURE_STATUS=str(status), FIXTURE_BODY=json.dumps(payload))
            result = subprocess.run(['bash', str(root / 'scripts/verify/stakeholder_finance_sanity.sh')],
                                    env=env, capture_output=True, text=True, timeout=15)
            self.assertEqual(list(temporary.iterdir()), [], 'Credentials and responses must be removed')
            self.assertNotIn(env['STAKEHOLDER_SMOKE_PASSWORD'], result.stdout + result.stderr)
            return result

    def test_success_requires_the_expected_safe_projection(self):
        result = self.run_gate(200, {'data': {'project': {'id': 'project-a', 'name': 'Fixture'}}})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('PASS: stakeholder finance sanity', result.stdout)

    def test_http_403_cannot_pass(self):
        result = self.run_gate(403, {'error': 'Insufficient rights'})
        self.assertEqual(result.returncode, 1)
        self.assertIn('got 403', result.stdout)

    def test_http_200_error_cannot_pass(self):
        result = self.run_gate(200, {'error': 'Insufficient rights'})
        self.assertEqual(result.returncode, 1)

    def test_nested_internal_cost_cannot_pass(self):
        result = self.run_gate(200, {'data': {'project': {'id': 'project-a', 'name': 'Fixture'},
                                           'nested': [{'actual_amount': 123}]}})
        self.assertEqual(result.returncode, 1)


if __name__ == '__main__':
    unittest.main()
