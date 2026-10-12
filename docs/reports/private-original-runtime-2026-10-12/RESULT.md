# Private original runtime repair — 2026-10-12

#433 introduced byte-bounded reads; #434 retained authenticated SDK streaming and before/after object metadata. Both returned 503 for an actual staging original. #436's audit on deployed `d3ca983` located the failure at `stream_open`, wrapped as `StorageUnknownError`. Byte delivery remained open.

A read-only probe with the installed SDK in Workerd (compatibility date `2024-12-30`) read the exact synthetic 70-byte PNG with default transport. Adding `redirect: "error"` raised `TypeError`, including without `cache: "no-store"`. `redirect: "manual"` succeeded with and without no-store and the timeout signal. This reproduces the transport incompatibility independently of app authorization.

The repair uses manual redirect mode. It prevents following redirects; the SDK rejects every non-2xx response before exposing its stream. Authentication, streaming byte caps, original length/MIME/version checks, post-I/O source/access checks and no-store responses remain required. Safe diagnostics unwrap at most two SDK wrappers and retain only allowlisted kinds and numeric status.

Validation: 72 tests across four selected helper/service/HTTP files PASS; TypeScript and scoped lint PASS before final commit. Five hermetic real-SDK/Workerd cases cover successful bytes, 302 without an external request, known oversized objects, oversized streams and object changes. Required CI now executes this runtime contract without external credentials/network.

Live staging/prod byte-delivery verification and exact fixture cleanup remain pending until the protected repair is deployed. Native Manager publication actions have a separate live simulator proof in #435; their success does not certify original download.
