#!/usr/bin/env python3
"""Scoped staging HTTP proof. Only exact, externally prepared QA fixtures mutate."""
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

STAGING = 'https://staging.aistroyka.ai'
DATABASE = 'https://vthfrxehrursfloevnlp.supabase.co'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise ValueError('Probe refused an HTTP redirect')


def request(url, method='GET', body=None, headers=None):
    if not any(url.startswith(host + '/') for host in (STAGING, DATABASE)):
        raise ValueError('Probe refused a noncanonical host')
    req = urllib.request.Request(url, method=method, data=None if body is None else json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', **(headers or {})})
    try:
        response = urllib.request.build_opener(NoRedirect).open(req, timeout=25)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.read(21 * 1024 * 1024), response.headers


def exact(actual, expected, label):
    if actual != expected:
        raise ValueError(label + ': HTTP ' + str(actual) + ', expected ' + str(expected))


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', value):
        raise ValueError('Invalid fixture identifier')
    return value


def validate_fixture(fixture):
    if not re.fullmatch(r'qa-published-evidence-[0-9a-f-]{36}', fixture.get('tag', '')):
        raise ValueError('Missing exact synthetic fixture tag')
    for key in ('tenant_id', 'owner_id', 'user_id', 'project_id', 'report_id', 'media_id', 'evidence_id', 'grant_id'):
        identifier(fixture.get(key))
    if not re.fullmatch(r'[0-9a-f]{64}', fixture.get('image_sha256', '')):
        raise ValueError('Missing synthetic image checksum')
    if fixture.get('email') != fixture['tag'] + '@example.com':
        raise ValueError('Unexpected fixture email')
    path = fixture.get('object_path', '')
    if path != fixture['tenant_id'] + '/' + fixture['project_id'] + '/' + fixture['tag'] + '.png':
        raise ValueError('Unexpected fixture Storage path')


def verify_fixture_row(table, ident, fields, owner):
    status, raw, _ = request(DATABASE + '/rest/v1/' + table + '?id=eq.' + ident + '&select=' + ','.join(fields), headers=owner)
    exact(status, 200, 'Exact fixture ' + table)
    rows = json.loads(raw)
    if len(rows) != 1 or any(rows[0].get(key) != value for key, value in fields.items()):
        raise ValueError('Fixture scope mismatch for ' + table)


def require_storage_denied(status):
    if status not in (400, 403, 404):
        raise ValueError('Direct Storage object access unexpectedly allowed or unverified')


def run(fixture, expected_sha):
    validate_fixture(fixture)
    if not re.fullmatch(r'[0-9a-f]{40}', expected_sha):
        raise ValueError('Expected a full reviewed SHA')
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'release'))
    from verify_deployed_commit import verify_host
    verify_host('staging.aistroyka.ai', expected_sha, 'staging')
    anon = fixture['anon_key']
    owner = {'apikey': anon, 'Authorization': 'Bearer ' + fixture['owner_access_token']}
    status, raw, _ = request(DATABASE + '/auth/v1/user', headers=owner)
    exact(status, 200, 'Owner task identity'); owner_user = json.loads(raw)
    if owner_user.get('id') != fixture['owner_id']:
        raise ValueError('Owner task identity mismatch')
    # Verify the exact parents/source/grant before any mutation. No broad filters.
    expected = [
        ('projects', fixture['project_id'], {'tenant_id': fixture['tenant_id'], 'name': fixture['tag']}),
        ('media', fixture['media_id'], {'tenant_id': fixture['tenant_id'], 'project_id': fixture['project_id'], 'file_url': fixture['object_path'], 'type': 'image'}),
        ('worker_reports', fixture['report_id'], {'tenant_id': fixture['tenant_id'], 'user_id': fixture['user_id'], 'status': 'approved'}),
        ('visual_evidence_records', fixture['evidence_id'], {'tenant_id': fixture['tenant_id'], 'project_id': fixture['project_id'], 'report_id': fixture['report_id'], 'media_id': fixture['media_id'], 'owner_visible': True, 'manager_verified': True}),
        ('project_stakeholders', fixture['grant_id'], {'tenant_id': fixture['tenant_id'], 'project_id': fixture['project_id'], 'user_id': fixture['user_id'], 'status': 'active'}),
    ]
    for table, ident, fields in expected:
        verify_fixture_row(table, ident, fields, owner)
    status, raw, _ = request(DATABASE + '/auth/v1/token?grant_type=password', 'POST', {'email': fixture['email'], 'password': fixture['password']}, {'apikey': anon})
    exact(status, 200, 'Fixture login'); session = json.loads(raw)
    if session['user']['id'] != fixture['user_id'] or session['user']['user_metadata'].get('qa_fixture') != fixture['tag']:
        raise ValueError('Fixture identity mismatch')
    token = session['access_token']
    if os.environ.get('GITHUB_ACTIONS') == 'true': print('::add-mask::' + token)
    actor = {'apikey': anon, 'Authorization': 'Bearer ' + token, 'x-client': 'ios_customer'}
    root = STAGING + '/api/v1/portal/projects/' + fixture['project_id'] + '/evidence'
    original = root + '/' + fixture['evidence_id'] + '/original'
    checks = []
    def check(name): checks.append({'check': name, 'pass': True}); print('PASS ' + name)
    def original_ok():
        status, raw, headers = request(original, headers=actor)
        exact(status, 200, 'Published original')
        if hashlib.sha256(raw).hexdigest() != fixture['image_sha256'] or headers.get('Content-Type') != 'image/png':
            raise ValueError('Original bytes differ from the exact synthetic image')
        if 'no-store' not in headers.get('Cache-Control', '') or headers.get('Location'):
            raise ValueError('Original response is cacheable or redirects')
    try:
        status, raw, headers = request(root, headers=actor); exact(status, 200, 'Published metadata')
        data = json.loads(raw)['data']; items = data['items']
        allowed = {'id', 'zone_label', 'before_after_kind', 'capture_timestamp', 'source_kind', 'updated_at', 'manager_verified', 'original_url'}
        if len(items) != 1 or set(items[0]) != allowed or items[0]['id'] != fixture['evidence_id'] or items[0]['original_url'] != original.removeprefix(STAGING):
            raise ValueError('Published DTO is not the expected safe synthetic projection')
        if 'no-store' not in headers.get('Cache-Control', ''): raise ValueError('Metadata is cacheable')
        check('safe_published_metadata'); original_ok(); check('exact_original_bytes_no_redirect_no_store')
        status, raw, _ = request(DATABASE + '/rest/v1/visual_evidence_records?id=eq.' + fixture['evidence_id'] + '&select=*', headers=actor)
        exact(status, 200, 'Raw evidence RLS'); assert json.loads(raw) == []; check('raw_provenance_denied')
        status, _, _ = request(DATABASE + '/storage/v1/object/sign/media/' + fixture['object_path'], 'POST', {'expiresIn': 60}, actor)
        require_storage_denied(status)
        check('raw_storage_sign_denied')
        status, _, _ = request(DATABASE + '/storage/v1/object/public/media/' + fixture['object_path'])
        require_storage_denied(status)
        check('unauthenticated_public_object_denied')
        evidence_url = DATABASE + '/rest/v1/visual_evidence_records?id=eq.' + fixture['evidence_id'] + '&tenant_id=eq.' + fixture['tenant_id'] + '&project_id=eq.' + fixture['project_id']
        status, _, _ = request(evidence_url, 'PATCH', {'owner_visible': False, 'manager_verified': False}, owner); exact(status, 204, 'Withdraw exact fixture publication')
        status, _, _ = request(original, headers=actor); exact(status, 404, 'Withdrawn original')
        status, raw, _ = request(root, headers=actor); exact(status, 200, 'Withdrawn metadata'); assert json.loads(raw)['data']['items'] == []; check('withdrawn_publication_revokes_original_and_metadata')
        status, _, _ = request(evidence_url, 'PATCH', {'owner_visible': True, 'manager_verified': True}, owner); exact(status, 204, 'Restore exact fixture publication')
        original_ok(); check('restored_approved_fixture_access')
        grant_url = DATABASE + '/rest/v1/project_stakeholders?id=eq.' + fixture['grant_id'] + '&tenant_id=eq.' + fixture['tenant_id'] + '&project_id=eq.' + fixture['project_id'] + '&user_id=eq.' + fixture['user_id']
        status, _, _ = request(grant_url, 'PATCH', {'status': 'revoked'}, owner); exact(status, 204, 'Revoke exact fixture grant')
        for url in (root, original):
            status, _, headers = request(url, headers=actor); exact(status, 404, 'Revoked project route')
            if 'no-store' not in headers.get('Cache-Control', ''): raise ValueError('Revocation response is cacheable')
        check('revoked_grant_blocks_metadata_and_original')
        return {'checks': checks, 'expected_sha7': expected_sha[:7], 'business_records_untouched': True, 'cleanup_required': True}
    finally:
        status, _, _ = request(DATABASE + '/auth/v1/logout?scope=global', 'POST', headers=actor)
        exact(status, 204, 'Fixture sessions revoke')


if __name__ == '__main__':
    try:
        fixture = json.loads(os.environ['OWNER_EVIDENCE_E2E_FIXTURE'])
        if os.environ.get('GITHUB_ACTIONS') == 'true':
            for key in ('owner_access_token', 'password', 'anon_key'): print('::add-mask::' + fixture[key])
        result = run(fixture, os.environ['EXPECTED_EVIDENCE_SHA'])
        Path('published-evidence-live-proof.json').write_text(json.dumps(result, indent=2) + '\n')
    except (ValueError, KeyError, AssertionError, OSError, urllib.error.URLError) as error:
        print('Scoped published evidence probe failed: ' + (str(error) if isinstance(error, ValueError) else 'fixture or transport verification failed'), file=sys.stderr)
        sys.exit(1)
