#!/usr/bin/env python3
"""Check an AISTROYKA checkout before resuming or starting work. No writes by default."""
import argparse
import json
import subprocess
import sys
from pathlib import Path


def git(cwd, *args):
    result = subprocess.run(['git', '-C', str(cwd), *args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Git check failed: ' + ' '.join(args[:2]))
    return result.stdout.strip()


def inspect(cwd, resume_pr=None):
    root = Path(git(cwd, 'rev-parse', '--show-toplevel'))
    head = git(root, 'rev-parse', 'HEAD')
    main = git(root, 'rev-parse', 'origin/main')
    behind, ahead = map(int, git(root, 'rev-list', '--left-right', '--count', 'origin/main...HEAD').split())
    dirty = bool(git(root, 'status', '--porcelain', '--untracked-files=all'))
    problems = []
    origin = git(root, 'remote', 'get-url', 'origin').lower().removesuffix('.git').rstrip('/')
    if origin not in ['git@github.com:2qjckdknjf-ctrl/aistroyka-web', 'https://github.com/2qjckdknjf-ctrl/aistroyka-web', 'ssh://git@github.com/2qjckdknjf-ctrl/aistroyka-web']:
        problems.append('Origin is not the canonical AISTROYKA repository; verify the workspace before continuing.')
    if behind:
        problems.append(f'Checkout is missing {behind} commits from origin/main; reconcile before new work.')
    if dirty:
        problems.append('Local changes exist; preserve and resume their task before starting another one.')
    if resume_pr is not None:
        result = subprocess.run(['gh', 'pr', 'view', str(resume_pr), '--repo', '2qjckdknjf-ctrl/Aistroyka-web', '--json', 'headRefOid,state'], capture_output=True, text=True)
        if result.returncode:
            problems.append('Cannot verify the requested PR; do not infer its current head from local state.')
        else:
            pr = json.loads(result.stdout)
            if pr['state'] != 'OPEN':
                problems.append('Requested PR is already closed or merged; check main before repeating it.')
            elif pr['headRefOid'] != head:
                problems.append('Local HEAD differs from the current PR HEAD; reconcile before resuming.')
    return {'path': str(root), 'branch': git(root, 'branch', '--show-current') or 'DETACHED', 'head': head, 'main': main, 'behind_main': behind, 'ahead_main': ahead, 'dirty': dirty, 'verdict': 'RECONCILE_FIRST' if problems else 'CURRENT_BASELINE', 'reasons': problems}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--path', default='.')
    parser.add_argument('--refresh', action='store_true', help='Fetch origin references without pruning or changing work files.')
    parser.add_argument('--resume-pr', type=int)
    args = parser.parse_args()
    try:
        if args.refresh:
            git(args.path, 'fetch', '--no-prune', 'origin')
        result = inspect(args.path, args.resume_pr)
    except (RuntimeError, ValueError, OSError, json.JSONDecodeError):
        print(json.dumps({'verdict': 'CHECK_UNAVAILABLE', 'reasons': ['Repository, remote main, or PR state could not be verified.']}, indent=2))
        return 2
    print(json.dumps(result, indent=2))
    return 0 if result['verdict'] == 'CURRENT_BASELINE' else 1


if __name__ == '__main__':
    sys.exit(main())
