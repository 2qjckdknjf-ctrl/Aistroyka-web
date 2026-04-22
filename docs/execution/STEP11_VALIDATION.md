# STEP11 VALIDATION

## Validation Run

- `bun run --cwd apps/web test lib/domain/approvals/pending-approvals.service.test.ts` => PASS
- `bun run build` => PASS
- `bun run test` => PASS

## Runtime Probe Matrix

- Production path (`aistroyka.ai` -> `www`):
  - `/api/v1/approvals/pending` => final `401` with `x-matched-path: /api/v1/approvals/pending` (route resolved + auth protected)
- Staging path:
  - `/api/v1/approvals/pending` => `404` Next not-found HTML page
- Deploy evidence:
  - latest successful staging deploy workflow run: `24616054744`
  - run head SHA: `d74657e0e9c6f76784588a966f793b450769ff11` (older runtime snapshot)
  - rerun deploy `24777783096` on branch head `36f3925fc9921d06448fbf5899cdd0af45f4446f` => SUCCESS, but endpoint remains `404`
  - rerun deploy `24778999751` (same server path / same branch) => SUCCESS, endpoint still `404`

## Interpretation

- Repo and production runtime include approvals queue endpoint.
- Staging does not reflect current queue surface/runtime contract (runtime/deploy parity drift confirmed even after fresh deploy from current remote branch).

