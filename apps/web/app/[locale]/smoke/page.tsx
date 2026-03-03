"use client";

/* DEV ONLY: Smoke test for Supabase connectivity. Remove or protect before production. */

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { callRPC, AppError } from "@/lib/rpc";
import { hasSupabaseEnv } from "@/lib/env";

export default function SmokePage() {
  const [sessionResult, setSessionResult] = useState<string>("");
  const [rpcName, setRpcName] = useState("");
  const [rpcParamsJson, setRpcParamsJson] = useState("{}");
  const [rpcResult, setRpcResult] = useState<string>("");
  const [rpcLoading, setRpcLoading] = useState(false);

  const envOk = hasSupabaseEnv();

  async function handleCheckSession() {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.getSession();
      setSessionResult(
        error ? `Error: ${error.message}` : JSON.stringify(data, null, 2)
      );
    } catch (e) {
      setSessionResult(`Throw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handlePingRPC() {
    const name = rpcName.trim();
    if (!name) {
      setRpcResult("Enter an RPC name.");
      return;
    }
    setRpcLoading(true);
    setRpcResult("");
    try {
      let params: Record<string, unknown> = {};
      try {
        params = JSON.parse(rpcParamsJson || "{}") as Record<string, unknown>;
      } catch {
        setRpcResult("Invalid JSON params.");
        setRpcLoading(false);
        return;
      }
      const data = await callRPC<unknown>(name, Object.keys(params).length > 0 ? params : undefined);
      setRpcResult(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      const msg =
        e instanceof AppError
          ? `${e.code}: ${e.message} ${e.context ? JSON.stringify(e.context) : ""}`
          : e instanceof Error
            ? e.message
            : String(e);
      setRpcResult(`Error: ${msg}`);
    } finally {
      setRpcLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-aistroyka-4 py-aistroyka-8">
      <div className="card mb-aistroyka-8 border-l-4 border-l-aistroyka-error">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-error sm:text-aistroyka-title">DEV ONLY — Smoke test</h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Verify Supabase env and connectivity. Remove or protect this route before production.
        </p>
      </div>

      <section className="card mb-aistroyka-6">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Supabase env</h2>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {envOk ? "OK — NEXT_PUBLIC_SUPABASE_URL and ANON_KEY set." : "Missing — set .env.local (see .env.local.example)."}
        </p>
      </section>

      <section className="card mb-aistroyka-6">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Check session</h2>
        <button type="button" onClick={handleCheckSession} className="btn-secondary mt-aistroyka-3">
          Check session
        </button>
        {sessionResult && (
          <pre className="mt-aistroyka-3 overflow-auto rounded-card-sm border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-aistroyka-3 text-aistroyka-caption text-aistroyka-text-primary">
            {sessionResult}
          </pre>
        )}
      </section>

      <section className="card">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Ping RPC</h2>
        <p className="mt-aistroyka-1 text-aistroyka-caption text-aistroyka-text-secondary">
          Enter an existing RPC name and optional JSON params, then click to call.
        </p>
        <div className="mt-aistroyka-3 flex flex-col gap-aistroyka-3">
          <input
            type="text"
            placeholder="RPC name"
            value={rpcName}
            onChange={(e) => setRpcName(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder='Params JSON e.g. {"id": "..."}'
            value={rpcParamsJson}
            onChange={(e) => setRpcParamsJson(e.target.value)}
            className="input-field font-mono"
          />
          <button type="button" onClick={handlePingRPC} disabled={rpcLoading} className="btn-primary w-fit disabled:opacity-50">
            {rpcLoading ? "Calling…" : "Call RPC"}
          </button>
        </div>
        {rpcResult && (
          <pre className="mt-aistroyka-3 overflow-auto rounded-card-sm border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-aistroyka-3 text-aistroyka-caption text-aistroyka-text-primary">
            {rpcResult}
          </pre>
        )}
      </section>
    </main>
  );
}
