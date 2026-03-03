"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input, Button, Alert } from "@/components/ui";

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

type SignInResult = {
  ok: boolean;
  stage: "supabase_ok" | "error";
  durationMs: number;
  traceId: string;
  errorCode?: string;
  errorMessage?: string;
  errorName?: string;
};

function safeString(value: unknown): string {
  if (value instanceof Error) return value.message;
  return String(value);
}

async function signInWithObservability(
  email: string,
  password: string,
  traceId: string
): Promise<SignInResult> {
  const start = Date.now();
  try {
    const supabase = createClient();
    const signInPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS)
    );
    const { error } = await Promise.race([signInPromise, timeoutPromise]);
    const durationMs = Date.now() - start;
    if (error) {
      if (typeof window !== "undefined") {
        console.error("[login] auth error", {
          traceId,
          errorCode: "auth",
          message: error.message,
          durationMs,
          emailPresent: !!email,
        });
      }
      return {
        ok: false,
        stage: "error",
        durationMs,
        traceId,
        errorCode: "auth",
        errorMessage: error.message,
      };
    }
    return { ok: true, stage: "supabase_ok", durationMs, traceId };
  } catch (thrown) {
    const durationMs = Date.now() - start;
    const isTimeout = thrown instanceof Error && thrown.message === "timeout";
    const isNetwork =
      thrown instanceof TypeError &&
      (safeString(thrown).toLowerCase().includes("fetch") || safeString(thrown).toLowerCase().includes("network"));
    const errorCode = isTimeout ? "timeout" : isNetwork ? "network" : "unknown";
    const errorMessage = safeString(thrown);
    const errorName = thrown instanceof Error ? thrown.name : undefined;
    if (typeof window !== "undefined") {
      console.error("[login] signIn failed", {
        traceId,
        errorCode,
        errorMessage,
        errorName,
        durationMs,
        emailPresent: !!email,
      });
    }
    return {
      ok: false,
      stage: "error",
      durationMs,
      traceId,
      errorCode,
      errorMessage,
      errorName,
    };
  }
}

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

  async function doSignIn() {
    setError(null);
    setStep("submitting");
    setLoading(true);
    const traceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
    try {
      const result = await signInWithObservability(email, password, traceId);
      if (!result.ok) {
        setStep(
          result.errorCode === "timeout"
            ? "error:timeout"
            : result.errorCode === "auth"
              ? "error:auth"
              : result.errorCode === "network"
                ? "error:network"
                : "error:unknown"
        );
        const msg = (result.errorMessage ?? "").toLowerCase();
        if (result.errorCode === "timeout") {
          setError("Request timed out. Please check your connection and try again.");
        } else if (result.errorCode === "auth" && (msg.includes("invalid") || msg.includes("credentials"))) {
          setError(t("invalidCredentials"));
        } else if (result.errorCode === "auth" && (msg.includes("email not confirmed") || msg.includes("confirm"))) {
          setError(t("emailNotConfirmed"));
        } else if (result.errorCode === "auth" && result.errorMessage) {
          setError(result.errorMessage);
        } else if (result.errorMessage && result.errorMessage.length < 200) {
          setError(result.errorMessage);
        } else {
          setError(t("defaultError") + ` (${result.errorCode ?? "unknown"}, traceId: ${result.traceId})`);
        }
        return;
      }
      setStep("supabase_ok");
      const targetPath = next.startsWith("/") ? next : `/${next}`;
      setStep("redirecting");
      if (typeof window !== "undefined") {
        window.location.href = targetPath;
        return;
      }
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
              <Button type="submit" loading={loading} disabled={loading} className="w-full">
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
