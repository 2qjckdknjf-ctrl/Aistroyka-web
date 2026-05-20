# Live System Health Guard Report

## Goal

Verify that live `/api/system/health` is access-protected.

## Commands executed

```bash
curl -i https://aistroyka.ai/api/system/health
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: WRONG_KEY"
```

Conditional command for correct key path was also prepared:

```bash
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"
```

## Results

1. No key request:
   - HTTP 401
   - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`
2. Wrong key request:
   - HTTP 401
   - Body: `{"error":"Unauthorized","message":"X-System-Key required"}`
3. Correct key path:
   - **BLOCKED_EXTERNAL**
   - `SYSTEM_API_KEY` was not available in the current runtime environment.

## Latest rerun (live-closure pass)

Commands rerun with identical matrix:

- no key -> HTTP 401
- wrong key -> HTTP 401
- correct key -> blocked (`SYSTEM_API_KEY_UNSET`)

Revalidation conclusion:

- deny-path protection remains correct and stable in production.
- allow-path still blocked externally by missing real key in current shell.

## Security conclusion

- Unauthorized access is blocked in production for no-key and wrong-key probes.
- Correct-key success payload verification remains external until operator injects valid key in environment.

## Operator command for closure

```bash
export SYSTEM_API_KEY='<REAL_SYSTEM_KEY>'
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"
```

## Verdict

**PARTIAL (guard proven for deny-paths, allow-path blocked external)**

