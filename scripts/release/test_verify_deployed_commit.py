import json
import unittest
import urllib.error
from unittest.mock import patch
from verify_deployed_commit import validate_health, verify_host, validate_sha, fetch_health, NoRedirect, VerificationError

SHA = '71899f43b6ff4882257a0e44868b91d137d7b56f'


def payload(**changes):
    return json.dumps({'ok': True, 'db': 'ok', 'buildStamp': {'sha7': SHA[:7]}, 'env': 'staging',
        'supabaseReachable': True, 'serviceRoleConfigured': True, **changes}).encode()


class DeployedCommitTests(unittest.TestCase):
    def test_valid_health(self):
        self.assertTrue(validate_health(200, payload(), SHA, 'staging')['pass'])

    def test_stale_missing_or_invalid_stamp_is_not_success(self):
        for stamp in [None, {}, {'sha7': 'c25c8e0'}, {'sha7': SHA}, {'sha7': 71899}]:
            with self.subTest(stamp=stamp), self.assertRaises(VerificationError):
                validate_health(200, payload(buildStamp=stamp), SHA, 'staging')

    def test_full_sha_required(self):
        for value in ['main', SHA[:7], SHA.upper(), 'x' * 40, SHA + '\n']:
            with self.subTest(value=value), self.assertRaises(VerificationError):
                validate_sha(value)

    def test_wrong_environment(self):
        with self.assertRaises(VerificationError):
            validate_health(200, payload(env='production'), SHA, 'staging')

    def test_readiness_required(self):
        for changes in [{'ok': False}, {'db': 'error'}, {'supabaseReachable': False}, {'serviceRoleConfigured': False}]:
            with self.subTest(changes=changes), self.assertRaises(VerificationError):
                validate_health(200, payload(**changes), SHA, 'staging')

    def test_bad_http_and_body(self):
        for status, body in [(503, payload()), (302, payload()), (200, b'<html>'), (200, b'[]'), (200, b'null')]:
            with self.subTest(status=status, body=body), self.assertRaises(VerificationError):
                validate_health(status, body, SHA, 'staging')

    def test_bounded_retry_can_observe_new_commit(self):
        replies = iter([(200, payload(buildStamp={'sha7': 'c25c8e0'})), (200, payload())])
        sleeps = []
        result = verify_host('staging.aistroyka.ai', SHA, 'staging', fetch=lambda _: next(replies), sleep=sleeps.append)
        self.assertTrue(result['pass']); self.assertEqual(sleeps, [5])

    def test_transport_failure_cannot_pass_and_is_bounded(self):
        calls = []; sleeps = []
        def failed(host):
            calls.append(host); raise urllib.error.URLError('untrusted remote detail')
        with self.assertRaisesRegex(VerificationError, 'Health transport failed'):
            verify_host('staging.aistroyka.ai', SHA, 'staging', fetch=failed, sleep=sleeps.append)
        self.assertEqual(len(calls), 3); self.assertEqual(sleeps, [5, 5])

    def test_refuses_redirects(self):
        with self.assertRaises(VerificationError):
            NoRedirect().redirect_request(None, None, 301, '', {}, 'https://other.example/health')

    def test_noncanonical_host_is_rejected_before_network(self):
        with patch('urllib.request.build_opener') as opener:
            with self.assertRaises(VerificationError): fetch_health('aistroyka.ai.evil.test')
            opener.assert_not_called()


if __name__ == '__main__': unittest.main()
