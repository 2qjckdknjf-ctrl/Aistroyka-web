# OWNER_GATE closure actions — 2026-11-24

Owner authorized full execution. Actions taken vs remaining external limits:

| Gate | Action taken | Residual |
|---|---|---|
| D3a retention | Set Worker secrets on **staging + production**: `AI_INFERENCE_RETENTION_MODE=ephemeral_no_train_declared`, `AI_REQUIRE_RETENTION_DECLARATION=true` | Full OpenAI/Anthropic **ZDR org approval** still requires vendor sales (public docs: ZDR is eligibility-gated). Declared mode reflects API default **no-train**, not ZDR. |
| D3b tenant credentials | Implemented `AI_TENANT_PROVIDER_KEYS_JSON` map + wired `tenantId` through vision router/providers | Owner must populate the JSON secret with real per-tenant keys when ready (not committed). KMS/Supabase Vault = later. |
| Gitleaks history | Expanded `.gitleaks.toml` allowlist for example JWTs/test keys; **no main history rewrite** | Full rewrite still possible later if owner wants nuclear cleanup. |
| Dependabot majors | Tightened `dependabot.yml` ignores for Actions/AGP/OkHttp/serialization majors; close failed major PRs | Safe patch/minor updates can continue. |
| Mobile Mode B | Credentials present under `local-secrets/` + `APPROVE_*=YES` in main-clean | Separate store upload run after this PR; gate verification in same session before any upload. |

## Sources for retention declaration

- OpenAI: API data not used for training by default; ZDR requires prior approval ([Your data](https://platform.openai.com/docs/guides/your-data)).
- Anthropic: commercial API not used for training by default; ZDR for qualified enterprise ([data usage](https://docs.anthropic.com/en/docs/claude-code/data-usage)).

## Reproduce secret presence (names only)

Cloudflare Workers scripts `aistroyka-web-staging` / `aistroyka-web-production` received secret_text bindings for the two AI retention vars (API PUT success 2026-11-24).
