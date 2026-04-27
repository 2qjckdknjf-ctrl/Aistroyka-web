# STAGE 5 — Launch checklist (pre-release)

**Status:** **DRAFT — NOT FINAL.** **Blocked** — STAGE 4 not closed (see `STAGE5_GO_NO_GO.md`). Do not treat this as an executable go-live until STAGE 4 evidence exists.

## Preconditions (from STAGE 4)

- [ ] `pilot_launch.sh` **exit 0** with `ops/metrics` **200** (tenant user JWT or cookie).
- [ ] Android Worker + Manager runtime flows with report IDs.
- [ ] iOS Worker + Manager runtime flows with report IDs.
- [ ] Cross-platform review state consistency.

## Release (when unblocked)

- [ ] Confirm production env vars per `docs/ENVIRONMENT-VARIABLES.md`.
- [ ] Vercel deploy green; post-deploy `pilot-smoke` job green if CI wired.
- [ ] Tag release; note build SHA in comms.

## Post-deploy

- [ ] Run `BASE_URL=https://aistroyka.ai` + authenticated `scripts/smoke/pilot_launch.sh`.
- [ ] Spot-check dashboard login and one critical path.
