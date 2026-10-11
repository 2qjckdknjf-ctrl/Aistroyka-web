#!/usr/bin/env python3
"""Read public health and verify the reviewed commit; never send credentials."""
import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request

TARGETS = {
    'staging': [('staging.aistroyka.ai', 'staging')],
    'production': [('aistroyka.ai', 'production'), ('www.aistroyka.ai', 'production')],
}


class VerificationError(ValueError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise VerificationError('Health endpoint redirected; verify the canonical route')


def validate_sha(sha):
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise VerificationError('Expected a full 40-character lowercase commit SHA')


def validate_health(status, body, expected_sha, expected_env):
    validate_sha(expected_sha)
    if status != 200:
        raise VerificationError('Health HTTP ' + str(status))
    try:
        data = json.loads(body)
    except (ValueError, UnicodeError):
        raise VerificationError('Health response is not valid JSON') from None
    if not isinstance(data, dict) or data.get('ok') is not True or data.get('db') != 'ok':
        raise VerificationError('Health is not ready')
    stamp = data.get('buildStamp')
    sha7 = stamp.get('sha7') if isinstance(stamp, dict) else None
    if sha7 != expected_sha[:7]:
        raise VerificationError('Runtime commit does not match reviewed source')
    if data.get('env') != expected_env:
        raise VerificationError('Runtime environment does not match the canonical host')
    if data.get('supabaseReachable') is not True or data.get('serviceRoleConfigured') is not True:
        raise VerificationError('Runtime database configuration is not ready')
    return {'http': status, 'sha7': sha7, 'env': expected_env, 'pass': True}


def fetch_health(host):
    if host not in {h for targets in TARGETS.values() for h, _ in targets}:
        raise VerificationError('Noncanonical health host')
    request = urllib.request.Request('https://' + host + '/api/v1/health',
        headers={'Accept': 'application/json', 'Cache-Control': 'no-cache', 'User-Agent': 'Aistroyka-Deployment-Verification'})
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(request, timeout=12) as response:
            return response.status, response.read(65537)
    except urllib.error.HTTPError as error:
        # Do not print or accept a server-provided error page.
        return error.code, b''


def verify_host(host, expected_sha, expected_env, attempts=3, fetch=fetch_health, sleep=time.sleep):
    validate_sha(expected_sha)
    if attempts < 1 or attempts > 5:
        raise VerificationError('Attempts must be between 1 and 5')
    for attempt in range(attempts):
        try:
            status, body = fetch(host)
            return {'host': host, **validate_health(status, body, expected_sha, expected_env)}
        except (VerificationError, OSError, urllib.error.URLError) as error:
            failure = str(error) if isinstance(error, VerificationError) else 'Health transport failed'
        if attempt + 1 < attempts:
            sleep(5)
    raise VerificationError(host + ': ' + failure)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', choices=['staging', 'production', 'both'], required=True)
    parser.add_argument('--expected-sha', required=True)
    args = parser.parse_args()
    try:
        validate_sha(args.expected_sha)
        targets = TARGETS['staging'] + TARGETS['production'] if args.target == 'both' else TARGETS[args.target]
        for host, env in targets:
            print(json.dumps(verify_host(host, args.expected_sha, env)), flush=True)
    except VerificationError as error:
        print('Deployment verification failed: ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
