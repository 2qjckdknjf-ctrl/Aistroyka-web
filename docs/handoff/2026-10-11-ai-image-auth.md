# Image and session-worker authorization continuation

Source: fix/ai-image-auth-2026-10-11 from e03cb5a. Image auth and the existing worker callback must ship together; the combined change also removes global session dequeue and repairs ambiguous completion RPCs. See the fresh audit and two task files for scope and isolated SQL/REST evidence.

Next: required CI plus independent current-head review, protected merge; apply only the additive complete_session_analysis_job migration after fresh receipt/schema checks and native isolation evidence; verify staging first, then production negative access and authenticated strict live-provider responses. Never probe processing against real queued jobs. Close stale #200 only once its image/video/worker security intent is covered and verified. Preserve its branch and the temporary worker preparation commit locally; do not broad-merge stale branches. Full roadmap completion is not claimed.
