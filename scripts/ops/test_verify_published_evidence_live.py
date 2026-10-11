import unittest
from unittest.mock import patch
from verify_published_evidence_live import validate_fixture, request, NoRedirect


def fixture():
    value = {'tag': 'qa-published-evidence-00000000-0000-4000-8000-000000000001', 'image_sha256': 'a' * 64}
    for index, key in enumerate(('tenant_id', 'owner_id', 'user_id', 'project_id', 'report_id', 'media_id', 'evidence_id', 'grant_id'), 1):
        value[key] = '00000000-0000-4000-8000-' + str(index).zfill(12)
    value['email'] = value['tag'] + '@example.com'
    value['object_path'] = value['tenant_id'] + '/' + value['project_id'] + '/' + value['tag'] + '.png'
    return value


class ScopeTests(unittest.TestCase):
    def test_accepts_only_complete_exact_synthetic_scope(self):
        validate_fixture(fixture())

    def test_rejects_business_names_or_missing_marker(self):
        for tag in ('business-project', '', 'qa-published-evidence-../../other'):
            with self.subTest(tag=tag), self.assertRaises(ValueError): validate_fixture({**fixture(), 'tag': tag})

    def test_requires_every_exact_parent_identifier(self):
        for key in ('tenant_id', 'owner_id', 'user_id', 'project_id', 'report_id', 'media_id', 'evidence_id', 'grant_id'):
            with self.subTest(key=key), self.assertRaises(ValueError): validate_fixture({**fixture(), key: 'all'})

    def test_refuses_other_storage_objects(self):
        for path in ('other/image.png', fixture()['tenant_id'] + '/business.png', fixture()['object_path'] + '/../other'):
            with self.subTest(path=path), self.assertRaises(ValueError): validate_fixture({**fixture(), 'object_path': path})

    def test_refuses_unverified_fixture_email_and_bytes(self):
        for change in ({'email': 'real-user@example.com'}, {'image_sha256': 'missing'}):
            with self.subTest(change=change), self.assertRaises(ValueError): validate_fixture({**fixture(), **change})

    def test_credentials_never_go_to_foreign_host(self):
        for url in ('https://staging.aistroyka.ai.evil.test/api', 'https://evil.test/', 'http://staging.aistroyka.ai/api', 'https://aistroyka.ai/api'):
            with self.subTest(url=url), patch('urllib.request.build_opener') as opener:
                with self.assertRaises(ValueError): request(url, headers={'Authorization': 'Bearer synthetic'})
                opener.assert_not_called()

    def test_refuses_redirect_forwarding(self):
        with self.assertRaises(ValueError): NoRedirect().redirect_request(None, None, 302, '', {}, 'https://evil.test/')


if __name__ == '__main__': unittest.main()
