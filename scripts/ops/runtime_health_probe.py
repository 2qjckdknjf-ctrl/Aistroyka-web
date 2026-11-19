#!/usr/bin/env python3
"""Read-only runtime health probe for the deployed web Workers.

Fetches `/api/v1/health` for each target and fails when a host does not answer
HTTP 200 with `ok: true`. Prints one line per host and, with `--summary-file`,
writes a markdown summary that the scheduled monitor posts to the incident issue.
"""
import argparse
import http.client
import json
import sys
import urllib.error
import urllib.request

TARGETS = {
    'production': 'https://aistroyka.ai',
    'staging': 'https://staging.aistroyka.ai',
}
SUMMARY_FIELDS = ('ok', 'db', 'supabaseReachable', 'env', 'reason')


def _read_body(response):
    """Read the full response body; IncompleteRead / short bodies become probe failures."""
    try:
        return response.read()
    except http.client.IncompleteRead as exc:
        # Prefer partial bytes if present so JSON details can still surface in the summary.
        if exc.partial:
            return exc.partial
        raise

def probe(base_url, timeout=20):
    url = base_url.rstrip('/') + '/api/v1/health'
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'aistroyka-runtime-health-probe'})
    status = None
    body = {}
    error = None
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = response.status
            raw = _read_body(response)
    except urllib.error.HTTPError as exc:
        status = exc.code
        try:
            raw = _read_body(exc)
        except Exception as read_exc:  # noqa: BLE001 — treat any body-read failure as unhealthy
            raw = b''
            error = f'health response truncated: {read_exc}'
    except (urllib.error.URLError, TimeoutError, OSError, http.client.IncompleteRead) as exc:
        raw = b''
        error = f'request failed: {exc}'
    if raw:
        try:
            parsed = json.loads(raw.decode('utf-8', errors='replace'))
            body = parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            error = error or 'health response is not JSON'
    healthy = status == 200 and body.get('ok') is True and error is None
    stamp = body.get('buildStamp') if isinstance(body.get('buildStamp'), dict) else {}
    return {
        'url': url,
        'status': status,
        'healthy': healthy,
        'sha7': stamp.get('sha7'),
        'details': {key: body.get(key) for key in SUMMARY_FIELDS if key in body},
        'error': error,
    }


def render_summary(results):
    lines = ['| Target | HTTP | Healthy | buildStamp | Details |', '|---|---|---|---|---|']
    for name, result in results.items():
        details = dict(result['details'])
        if result['error']:
            details['error'] = result['error']
        detail_text = ', '.join(f'{key}={str(value).strip()}' for key, value in details.items()) or '-'
        lines.append(f"| {name} | {result['status'] or '-'} | {'yes' if result['healthy'] else 'NO'} | {result['sha7'] or '-'} | {detail_text} |")
    return '\n'.join(lines) + '\n'


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', choices=[*TARGETS, 'both'], default='both')
    parser.add_argument('--base-url', action='append', default=[], help='Probe this base URL instead of the named targets (repeatable).')
    parser.add_argument('--summary-file')
    parser.add_argument('--timeout', type=float, default=20)
    args = parser.parse_args(argv)

    if args.base_url:
        targets = {url: url for url in args.base_url}
    elif args.target == 'both':
        targets = dict(TARGETS)
    else:
        targets = {args.target: TARGETS[args.target]}

    results = {name: probe(url, timeout=args.timeout) for name, url in targets.items()}
    for name, result in results.items():
        verdict = 'PASS' if result['healthy'] else 'FAIL'
        print(f"{verdict} {name} {result['url']} http={result['status']} sha7={result['sha7']} details={json.dumps(result['details'], ensure_ascii=False)} error={result['error']}")
    if args.summary_file:
        with open(args.summary_file, 'w', encoding='utf-8') as handle:
            handle.write(render_summary(results))
    return 0 if all(result['healthy'] for result in results.values()) else 1


if __name__ == '__main__':
    sys.exit(main())
