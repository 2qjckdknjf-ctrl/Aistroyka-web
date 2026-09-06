# Release Hardening — Security Wave 9B

Date: 2026-09-06
Scope: AI chat message role provenance only
Master tracker: #282

## Confirmed production finding

Read-only inspection of production Supabase `vthfrxehrursfloevnlp` showed:

- `ai_chat_messages` role constraint allows `user | assistant | system`;
- live policy `ai_chat_messages_tenant` is an historical broad `ALL` tenant policy;
- Wave 6 in the release-hardening stack already replaces that broad surface with own-thread, append-only authenticated INSERT;
- Wave 6 intentionally did not yet distinguish message role provenance.

Therefore an authenticated client could still forge `assistant` or `system` rows until a trusted server-writer boundary is established.

## Runtime audit

`POST /api/v1/projects/:id/copilot/chat/stream` already requires `getAdminClient()` before the LLM gate and uses that admin client for policy/usage persistence.

Before this wave:
- user message persistence used the request-scoped authenticated Supabase client;
- assistant message persistence also used the request-scoped authenticated Supabase client.

Repository search found no second production assistant-message writer that needs authenticated `assistant`/`system` INSERT permission.

## Forward fix

1. Keep user message persistence on the authenticated client.
2. Move `persistAssistantMessage()` to the already-required admin/service-role client.
3. Replace Wave 6 authenticated INSERT policy with the same tenant/project/thread ownership checks plus mandatory `role = 'user'`.
4. Do not add authenticated UPDATE/DELETE policies.
5. Do not add any client path for `assistant` or `system` writes.
6. Keep global `getAdminClient()` typing unchanged and scope the ungenerated-table typing only to the Copilot stream call site with `getAdminClient() as SupabaseClient | null`. No `any`; runtime client construction and credentials are unchanged.

## Typecheck corrections

- CI #603 on `453e4cb3...`: lint passed; TypeScript failed because the inferred admin-client relation for ungenerated `ai_chat_messages` became `never`.
- First correction changed global `getAdminClient()` typing to `SupabaseClient`.
- CI #604 showed that global change had excessive blast radius: two existing platform-leads `@ts-expect-error` directives became unused.
- Final correction restores `admin.ts` exactly to its prior typing and applies the explicit `SupabaseClient` assertion only inside the Copilot stream route.

This keeps the security boundary narrow and leaves all unrelated admin callers unchanged.

## Resulting trust boundary

- authenticated client: own authorized thread, append-only, `role='user'` only;
- server/service-role: trusted assistant/system persistence when explicitly implemented server-side;
- read access remains governed by Wave 6 own-thread/project policy;
- existing streaming/fallback behavior is preserved because assistant persistence still occurs inside the same route, now through `admin`.

## Regression coverage

`ai-chat-role-provenance.hardening.test.ts` verifies:
- authenticated INSERT policy requires `role='user'`;
- tenant/project/thread ownership predicates remain present;
- user message persistence remains request-scoped;
- assistant persistence uses `admin` and no longer uses the request-scoped client;
- global `admin.ts` typing remains unchanged;
- the explicit ungenerated-relation `SupabaseClient` typing stays scoped to the Copilot route.

## Safety

- no production mutation
- no migration apply
- no deploy
- no feature scope
- stacked Draft PR only
- cumulative CI + iOS validation required before release
