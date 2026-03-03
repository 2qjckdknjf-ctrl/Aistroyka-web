"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { hasSupabaseEnv } from "@/lib/env";
import { Input, Button, Alert } from "@/components/ui";
import { signInAction } from "./actions";

const SIGN_IN_TIMEOUT_MS = 15_000;

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("idle");
  const [envOk, setEnvOk] = useState<boolean | null>(null);

  useEffect(() => {
    setEnvOk(hasSupabaseEnv());
  }, []);

  async function doSignIn() {
    setError(null);
    setStep("submitting");
    setLoading(true);
    const traceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
    try {
      const timeoutPromise = new Promise<{ ok: false; errorMessage: string }>((resolve) =>
        setTimeout(
          () => resolve({ ok: false, errorMessage: "Request timed out. Please check your connection and try again." }),
          SIGN_IN_TIMEOUT_MS
        )
      );
      const result = await Promise.race([
        signInAction(email, password, traceId),
        timeoutPromise,
      ]);
      if (!result.ok) {
        const isTimeout = result.errorMessage?.includes("timed out") ?? false;
        setStep(isTimeout ? "error:timeout" : "error:auth");
        const msg = (result.errorMessage ?? "").toLowerCase();
        if (isTimeout) {
          setError(result.errorMessage ?? "Request timed out.");
        } else if (msg.includes("invalid") || msg.includes("credentials")) {
          setError(t("invalidCredentials"));
        } else if (msg.includes("email not confirmed") || msg.includes("confirm")) {
          setError(t("emailNotConfirmed"));
        } else if (result.errorMessage && result.errorMessage.length < 200) {
          setError(result.errorMessage);
        } else {
          setError(t("defaultError") + ` (traceId: ${traceId})`);
        }
        return;
      }
      setStep("supabase_ok");
      const targetPath = next.startsWith("/") ? next : `/${next}`;
      setStep("redirecting");
      router.push(targetPath);
      router.refresh();
    } catch (thrown) {
      setStep("error:unknown");
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown);
      if (typeof window !== "undefined") {
        console.error("[login] unexpected throw", { traceId, errorMessage: errMsg, name: thrown instanceof Error ? thrown.name : undefined });
      }
      if (errMsg && errMsg.length < 200 && !errMsg.toLowerCase().includes("password")) {
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
          <div className="mb-aistroyka-6 text-center sm:mb-aistroyka-8">
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">{t("login")}</h1>
            <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("tagline")}</p>
          </div>
          {envOk === false && (
            <Alert
              message="Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local or Cloudflare build env)."
              style="error"
              className="mb-aistroyka-4"
            />
          )}
          <form onSubmit={handleSubmit} className="space-y-aistroyka-5">
            <Input
              id="email"
              type="email"
              label={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              <Button type="submit" loading={loading} disabled={loading || envOk === false} className="w-full">
                {loading ? t("signingIn") : t("signIn")}
              </Button>
            )}
          </form>
          <p
            className="mt-aistroyka-4 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
            aria-live="polite"
          >
            Login step: {step}
          </p>
          <p className="mt-aistroyka-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("noAccount")}{" "}
            <Link href="/register" className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm">
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
