#!/usr/bin/env python3
"""Verify a real project projection before claiming customer finance isolation."""
import argparse
import json
import sys

DENY_KEYS = frozenset({
    'project_cost_items', 'planned_amount', 'actual_amount', 'margin',
    'profitability', 'budget_pressure', 'cost_overrun', 'subcontractor_cost',
    'internal_cost_item_id', 'ai_finance_risk',
})


def validate_payload(payload, expected_project_id):
    data = payload.get('data') if isinstance(payload, dict) else None
    project = data.get('project') if isinstance(data, dict) else None
    if not isinstance(project, dict) or project.get('id') != expected_project_id or not isinstance(project.get('name'), str):
        raise ValueError('Portal response is not the expected project projection')
    if payload.get('error'):
        raise ValueError('Portal returned an error alongside the projection')

    def walk(obj, path=''):
        if isinstance(obj, dict):
            for key, value in obj.items():
                normalized = key.lower()
                if normalized in DENY_KEYS or 'internal_cost' in normalized:
                    raise ValueError('Forbidden customer field: ' + path + key)
                walk(value, path + key + '.')
        elif isinstance(obj, list):
            for index, item in enumerate(obj):
                walk(item, path + str(index) + '.')
    walk(payload)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project-id', required=True)
    args = parser.parse_args()
    try:
        validate_payload(json.load(sys.stdin), args.project_id)
    except (ValueError, UnicodeError) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        return 1
    print('PASS: expected customer project projection and finance keys verified')
    return 0


if __name__ == '__main__': sys.exit(main())
