# @aistroyka/api-client

Minimal typed TypeScript client for Aistroyka API v1. Reference implementation for web; mobile teams can generate Swift/Kotlin from OpenAPI (see repo docs).

## Usage

```ts
import { createClient } from "@aistroyka/api-client";

const client = createClient({
  baseUrl: "https://api.aistroyka.ai",
  getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
});

const health = await client.health();
const projects = await client.projects.list();
const result = await client.ai.analyzeImage({ image_url: "https://..." });
```

## Mobile SDK generation

OpenAPI spec: `packages/contracts-openapi/dist/openapi.json`.

- **iOS (Swift):** `openapi-generator-cli generate -i openapi.json -g swift5 -o ./sdk-ios`
- **Android (Kotlin):** `openapi-generator-cli generate -i openapi.json -g kotlin -o ./sdk-android`

Versioning: v1 is stable; breaking changes go to v2. Pin client to API version (e.g. base path `/api/v1`).
