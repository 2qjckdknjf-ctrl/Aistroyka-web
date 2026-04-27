"use client";

/* DEV ONLY: Smoke test for Supabase connectivity. Remove or protect before production. */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { callRPC, AppError } from "@/lib/rpc";
import { hasSupabaseEnv } from "@/lib/env";

export default function SmokePage() {
  const t = useTranslations("smoke");
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
        error ? `${t("error")}: ${error.message}` : JSON.stringify(data, null, 2)
      );
    } catch (e) {
      setSessionResult(`${t("throw")}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handlePingRPC() {
    const name = rpcName.trim();
    if (!name) {
      setRpcResult(t("enterRpcName"));
      return;
    }
    setRpcLoading(true);
    setRpcResult("");
    try {
      let params: Record<string, unknown> = {};
      try {
        params = JSON.parse(rpcParamsJson || "{}") as Record<string, unknown>;
      } catch {
        setRpcResult(t("invalidJsonParams"));
        setRpcLoading(false);
        return;
      }
      const data = await callRPC<unknown>(name, Object.keys(params).length > 0 ? params : undefined);
      setRpcResult(`${t("success")}: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      const msg =
        e instanceof AppError
          ? `${e.code}: ${e.message} ${e.context ? JSON.stringify(e.context) : ""}`
          : e instanceof Error
            ? e.message
            : String(e);
      setRpcResult(`${t("error")}: ${msg}`);
    } finally {
      setRpcLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-aistroyka-4 py-aistroyka-8">
      <div className="card mb-aistroyka-8 border-l-4 border-l-aistroyka-error">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-error sm:text-aistroyka-title">{t("devOnlySmokeTest")}</h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {t("verifyEnvAndConnectivity")}
        </p>
      </div>

      <section className="card mb-aistroyka-6">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{t("supabaseEnv")}</h2>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {envOk ? t("envOk") : t("envMissing")}
        </p>
      </section>

      <section className="card mb-aistroyka-6">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{t("checkSession")}</h2>
        <button type="button" onClick={handleCheckSession} className="btn-secondary mt-aistroyka-3">
          {t("checkSession")}
        </button>
        {sessionResult && (
          <pre className="mt-aistroyka-3 overflow-auto rounded-card-sm border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-aistroyka-3 text-aistroyka-caption text-aistroyka-text-primary">
            {sessionResult}
          </pre>
        )}
      </section>

      <section className="card">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{t("pingRpc")}</h2>
        <p className="mt-aistroyka-1 text-aistroyka-caption text-aistroyka-text-secondary">
          {t("pingRpcHint")}
        </p>
        <div className="mt-aistroyka-3 flex flex-col gap-aistroyka-3">
          <input
            type="text"
            placeholder={t("rpcName")}
            value={rpcName}
            onChange={(e) => setRpcName(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder={t("paramsJsonExample")}
            value={rpcParamsJson}
            onChange={(e) => setRpcParamsJson(e.target.value)}
            className="input-field font-mono"
          />
          <button type="button" onClick={handlePingRPC} disabled={rpcLoading} className="btn-primary w-fit disabled:opacity-50">
            {rpcLoading ? t("calling") : t("callRpc")}
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
