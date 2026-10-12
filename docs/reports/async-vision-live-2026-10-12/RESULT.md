# Async image job live proof — 2026-10-12

Protected #438 merged as `be28832ccf974a9af0b9a5fd1171241e50bed1ab`. Staging 38190300905 and production 38190541329 SUCCESS. Against served staging `be28832`, the canonical project jobs API created one exact synthetic image job (202); repeating request_key reused the same ID. The caller-visible queue was empty before creation and contained only that fixture before processing. The authenticated session executor processed that exact job and completed it; readback found one ai_analysis row linked to its job/media/tenant. This exercises the existing executor and result persistence, not a new implementation.

The canonical `bash scripts/smoke/ai_live_provider.sh --require-live` gate returned exit 0: live provider attempted/succeeded, llm_success_count=1, fallback_count=0. The additional owner's task-local session was revoked. See [job](job.json) and [provider gate](provider.json).

Exact cleanup removed the terminal job and source result, verified both absent, then removed the synthetic project/report/media/evidence/grant/identity and PNG. Temporary user sessions and owner task sessions were revoked; no repository fixture secret was uploaded. Audit traces were retained. See [job cleanup](job-cleanup.json) and [fixture cleanup](fixture-cleanup.json).

The expected project-scoped ai_vision_analyze_complete audit row was absent after this successful scoped request. The route launched five metadata audit paths with void and returned without waiting. The candidate awaits the existing bounded writer (2-second maximum), retaining requester RLS and preserving responses when audit storage fails. Thirteen route tests include delayed audit and rejected audit storage; TypeScript/lint PASS. Fresh deployed audit readback is still required.

This proof does not establish reviewed AI observations, video execution, Graph promotion or full Worker camera/upload/submit UX. Those remain explicit plan tasks; physical iPhone/store/legal/billing gates are separate.
