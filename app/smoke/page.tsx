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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-lg font-semibold text-red-600">DEV ONLY — Smoke test</h1>
      <p className="mt-1 text-sm text-gray-600">
        Verify Supabase env and connectivity. Remove or protect this route before production.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Supabase env</h2>
        <p className="mt-1 text-sm">
          {envOk ? "OK — NEXT_PUBLIC_SUPABASE_URL and ANON_KEY set." : "Missing — set .env.local (see .env.local.example)."}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Check session</h2>
        <button
          type="button"
          onClick={handleCheckSession}
          className="mt-2 rounded border border-gray-400 bg-white px-3 py-1.5 text-sm"
        >
          Check session
        </button>
        {sessionResult && (
          <pre className="mt-2 overflow-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs">
            {sessionResult}
          </pre>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Ping RPC</h2>
        <p className="mt-1 text-xs text-gray-600">
          Enter an existing RPC name and optional JSON params, then click to call.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            placeholder="RPC name"
            value={rpcName}
            onChange={(e) => setRpcName(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder='Params JSON e.g. {"id": "..."}'
            value={rpcParamsJson}
            onChange={(e) => setRpcParamsJson(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
          />
          <button
            type="button"
            onClick={handlePingRPC}
            disabled={rpcLoading}
            className="w-fit rounded border border-gray-400 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {rpcLoading ? "Calling…" : "Call RPC"}
          </button>
        </div>
        {rpcResult && (
          <pre className="mt-2 overflow-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs">
            {rpcResult}
          </pre>
        )}
      </section>
    </main>
  );
}
