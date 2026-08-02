"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { hasSupabaseEnv } from "@/lib/env";
import { Input, Button, Alert } from "@/components/ui";
import { AuthProviderButtons } from "@/components/auth/AuthProviderButtons";
import { resolvePostAuthEntry } from "@/lib/entry/entry-routing";

const SIGN_IN_TIMEOUT_MS = 25_000;
const LOGIN_ENDPOINT = "/api/v1/auth/login";

export type LoginStep =
  | "idle"
  | "submitting"
  | "supabase_ok"
  | "redirecting"
  | "error:timeout"
  | "error:auth"
  | "error:network"
  | "error:unknown";

function LoginForm() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  // Do not invent next=/dashboard — that would force explicit_next and break stakeholder G-11 portal landing.
  const next = searchParams?.get("next") ?? undefined;
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("idle");
  const [envOk, setEnvOk] = useState<boolean | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(true);

  useEffect(() => {
    setEnvOk(hasSupabaseEnv());
  }, []);

  async function doSignIn() {
    setError(null);
    setStep("submitting");
    setLoading(true);
    const traceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;

    const log = (step: string, status: string, code?: string, message?: string) => {
      if (typeof window !== "undefined") {
        console.error("[login]", { traceId, step, status, code, message });
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SIGN_IN_TIMEOUT_MS);
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, traceId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data: { ok: boolean; message?: string };
      try {
        data = await res.json();
      } catch {
        log("parse", "error", "invalid_json");
        setStep("error:unknown");
        setError(t("defaultError") + ` (traceId: ${traceId})`);
        return;
      }

      if (!res.ok) {
        const isTimeout = res.status === 408 || (data.message ?? "").toLowerCase().includes("timeout");
        const isAuth = res.status === 401;
        setStep(isTimeout ? "error:timeout" : isAuth ? "error:auth" : "error:unknown");
        log("signIn", "error", isAuth ? "auth" : "server", data.message);
        const msg = (data.message ?? "").toLowerCase();
        if (isTimeout || (data.message ?? "").includes("timed out")) {
          setError(data.message ?? "Request timed out. Please try again.");
        } else if (isAuth && (msg.includes("invalid") || msg.includes("credentials"))) {
          setError(t("invalidCredentials"));
        } else if (isAuth && (msg.includes("email not confirmed") || msg.includes("confirm"))) {
          setError(t("emailNotConfirmed"));
        } else if (data.message && data.message.length < 200) {
          setError(data.message);
        } else {
          setError(t("defaultError") + ` (traceId: ${traceId})`);
        }
        return;
      }

      if (!data.ok) {
        setStep("error:auth");
        log("signIn", "error", "auth", data.message);
        setError(data.message && data.message.length < 200 ? data.message : t("defaultError") + ` (traceId: ${traceId})`);
        return;
      }

      setStep("supabase_ok");
      let activeRole: string | null = null;
      try {
        const meRes = await fetch("/api/v1/me", { credentials: "include" });
        if (meRes.ok) {
          const meJson = (await meRes.json()) as { data?: { role?: string | null } };
          activeRole = typeof meJson.data?.role === "string" ? meJson.data.role : null;
        }
      } catch {
        activeRole = null;
      }
      const { path: pathWithLocale } = resolvePostAuthEntry({
        locale,
        next,
        baseUrl: typeof window !== "undefined" ? window.location.origin : "https://aistroyka.ai",
        activeRole,
      });
      setStep("redirecting");
      log("redirect", "ok");
      window.location.href = pathWithLocale;
    } catch (thrown) {
      const isAbort = thrown instanceof Error && thrown.name === "AbortError";
      setStep(isAbort ? "error:timeout" : "error:unknown");
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown);
      log("signIn", "error", isAbort ? "timeout" : "unknown", errMsg);
      if (isAbort) {
        setError("Request timed out. Please check your connection and try again.");
      } else if (errMsg && errMsg.length < 200 && !errMsg.toLowerCase().includes("password")) {
        setError(errMsg);
      } else {
        setError(t("defaultError") + ` (traceId: ${traceId})`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSignIn();
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-aistroyka-bg-primary px-aistroyka-4 py-aistroyka-8 sm:py-aistroyka-12">
      <div className="w-full max-w-[400px]">
        <div className="card-elevated">
          <div className="mb-aistroyka-4 flex justify-center">
            <Image src="/brand/aistroyka-logo.png" alt={t("tagline")} width={140} height={48} className="h-12 w-auto object-contain" unoptimized />
          </div>
          <div className="mb-aistroyka-6 text-center sm:mb-aistroyka-8">
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">{t("login")}</h1>
            <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("tagline")}</p>
          </div>
          {envOk === false && (
            <Alert
              message="Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local or Cloudflare build env)."
              style="error"
              className="mb-aistroyka-4"
            />
          )}
          <AuthProviderButtons
            mode="login"
            nextPath={next ?? "/dashboard"}
            onContinueEmail={() => {
              setShowEmailForm(true);
              queueMicrotask(() => {
                document.getElementById("email-login-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
              });
            }}
          />
          <div className="my-4 h-px bg-aistroyka-border-subtle" />
          <form id="email-login-form" onSubmit={handleSubmit} className="space-y-aistroyka-5">
            <Input
              id="email"
              type="email"
              name="email"
              label={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              required
            />
            <Input
              id="password"
              type="password"
              name="password"
              label={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              required
            />
            {error && (
              <div className="space-y-2">
                <Alert message={error} style="error" />
                <Button type="button" variant="secondary" className="w-full" onClick={() => doSignIn()}>
                  Retry
                </Button>
              </div>
            )}
            {!error && (
              <Button type="submit" loading={loading} disabled={loading || envOk === false} className="w-full" aria-busy={loading}>
                {loading ? t("signingIn") : t("signIn")}
              </Button>
            )}
          </form>
          {showEmailForm ? (
            <p
              className="mt-aistroyka-4 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
              aria-live="polite"
              aria-atomic="true"
            >
              {t("loginStep")}: {step}
            </p>
          ) : null}
          <p className="mt-aistroyka-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("noAccount")}{" "}
            <Link href={registerHref} className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm">
              {t("createAccount")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-aistroyka-4 py-aistroyka-8 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">{tCommon("loading")}</div>}>
      <LoginForm />
    </Suspense>
  );
}
