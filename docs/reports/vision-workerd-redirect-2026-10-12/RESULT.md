# Async Vision transport correction — 2026-10-12

The existing session-scoped executor also used `redirect: "error"` for its authenticated AI HTTP request. The private-original investigation reproduced that mode's TypeError in Workerd at the configured compatibility date. Reuse the existing executor and replace this mode with `manual`: the caller bearer stays on the original destination, redirects remain non-success responses, and their bodies are cancelled before failure classification.

Validation: 38 cases in the existing executor/scope/lifecycle suites PASS, TypeScript and scoped lint PASS. All five redirect statuses (301/302/303/307/308) produce one request, no completion RPC and a tenant/execution-token-scoped failure RPC. Concurrent claiming, caller RLS, foreign-source refusal and degraded fallback rejection remain tested.

This is a transport correction, not a video executor or source-linked result redesign. A fresh deployed async image job still needs live provider/result evidence. Video execution and reviewed preproject extraction remain their existing planned tasks.
