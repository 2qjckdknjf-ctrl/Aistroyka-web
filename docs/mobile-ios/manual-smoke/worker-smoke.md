# Manual smoke — AiStroyka Worker (staging / pilot)

Use with a **pilot** Supabase user and `BASE_URL`/`Secrets` pointing at the same environment.  
Full matrix: `docs/mobile-ios/IOS_E2E_VALIDATION_REPORT.md` (Layer B).

## Environment (record)

| Field | Value |
|--------|--------|
| Date | |
| Git SHA / build | |
| `BASE_URL` | |
| Device / OS | |

## Checklist

- [ ] Cold launch → onboarding or login as expected (`AISTROYKA_UI_TEST` **off**).
- [ ] Sign in with pilot worker.
- [ ] Project picker loads; select project.
- [ ] Shift start / end (if used).
- [ ] New report: attach photos → submit; queue drains (pending banner clears).
- [ ] Sync / inbox: no unexpected 403 (`ios_lite` + allow-list).
- [ ] Manager feedback: if `changes_requested`, open resubmit → thumbnails + submit again.
- [ ] Home card: hints/assistant (not empty after allow-list fix) or note server error.

## Notes

```
(pastes, screenshots path, ticket id)
```
