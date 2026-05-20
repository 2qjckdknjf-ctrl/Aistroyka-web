# AISTROYKA Cloudflare Agent

Stateful Cloudflare Agent starter for realtime assistant-style workflows.

## What is included

- `AistroykaFieldAgent` with persistent state (`messages`, `reminders`)
- WebSocket message handling (`chat`, `schedule_reminder`)
- Callable RPC method: `chat()`
- Durable scheduling example: `sendReminder()`
- Agent routing via `routeAgentRequest()`

## Local setup

```bash
cd apps/cloudflare-agent
npm install
npm run dev
```

The Worker runs in local mode (`wrangler dev --local`) to avoid Cloudflare auth requirements during local development.

## Deploy

```bash
cd apps/cloudflare-agent
npm run deploy
```

If you explicitly need remote dev mode:

```bash
npm run dev:remote
```

## Optional: Workers AI binding

`wrangler.jsonc` already includes:

```json
"ai": { "binding": "AI" }
```

If AI is available in your account/environment, the agent uses `@cf/meta/llama-3-8b-instruct`.
If AI is unavailable or fails, the agent falls back to stateful echo and keeps history.

## Endpoints and routing

- Base check: `/`
- Agent route: `/agents/aistroyka-field-agent/<instance-name>`

Example instance URL:

```text
https://<your-worker>.workers.dev/agents/aistroyka-field-agent/demo
```

## WebSocket payloads

### Chat

```json
{
  "type": "chat",
  "content": "What is my next priority?"
}
```

### Schedule reminder

```json
{
  "type": "schedule_reminder",
  "text": "Review unresolved defects",
  "delaySeconds": 1800
}
```

## Notes

- The starter persists full chat/reminder state even without AI binding.
- AI model call is implemented with graceful fallback behavior.
