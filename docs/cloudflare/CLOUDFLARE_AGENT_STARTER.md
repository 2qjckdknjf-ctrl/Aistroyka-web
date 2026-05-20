# Cloudflare Agent Starter

## Location

- `apps/cloudflare-agent`

## Purpose

This module provides a minimal stateful Cloudflare Agent scaffold for AISTROYKA experiments:

- Durable state (`messages`, `reminders`)
- Realtime message handling via Agent WebSocket lifecycle
- Callable method (`chat`)
- Scheduled callback example (`sendReminder`)
- Optional Workers AI usage with safe fallback

## Commands

From repo root:

- `npm run cf:agent:check` — type-check agent
- `npm run cf:agent:dev` — run locally with Wrangler (`--local`)
- `npm run cf:agent:deploy` — deploy agent Worker

Or directly:

```bash
cd apps/cloudflare-agent
npm install
npm run check
npm run dev
```

## Routing

`src/index.ts` uses `routeAgentRequest(...)` with CORS enabled.

Expected path pattern:

`/agents/<agent-name>/<instance-name>`

Example:

`/agents/aistroyka-field-agent/demo`

## AI Binding

`wrangler.jsonc` declares:

```json
"ai": { "binding": "AI" }
```

`runAssistant()` tries Workers AI model `@cf/meta/llama-3-8b-instruct`.  
If AI is missing or fails, the agent keeps state and returns a fallback response.
