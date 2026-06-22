# Draft PR Preflight — 2026-06-20

## Branch
- Current branch: `integration/aistroyka-full-reconciliation-2026-06-20`
- HEAD before PR docs: `c3ec717ca53647b09ae4552a4b6fd82e0579aab8`
- Base main SHA: `ff537c8dec1d9dcdd7ef834894951e625aa97a87`

## Working Tree
- Preflight status: clean before validation.
- Validation produced the known `package-lock.json` install metadata side effect.
- Side effect was inspected and reverted before PR docs were created.

## Commits Since Main
```text
c3ec717c feat: add owner admin reports export UI
13ea22a5 docs: plan reports export UI entry point
7ccff5d8 fix: harden project subnavigation UX
3db40ed9 feat: add project scoped dashboard subnavigation
d93d5a27 docs: plan dashboard navigation visibility slice
11ce9632 docs: audit frontend visibility gaps
2b5300bd docs: checkpoint reconciliation integration branch
68cf45fd fix: harden report review workflow
5c9c8623 fix: harden reports CSV export access
609ec044 feat: add safe manager reports CSV export
21450372 docs: plan export report backend slice
8c939a40 docs: audit backend api reconciliation
647723de docs: audit database and contracts reconciliation
83ace2f5 docs: record release ops integration status
d2f339aa docs: preserve reconciliation audit evidence
```

## Diff Summary
- Product changes are limited to:
  - manager/admin reports CSV backend export
  - report export access hardening
  - report review workflow guard/tests
  - project scoped dashboard subnavigation
  - owner/admin project reports export UI
- Reconciliation docs live under `docs/reconciliation/**`.

## Main Untouched
- No merge to main.
- No push to main.
- No deploy.
