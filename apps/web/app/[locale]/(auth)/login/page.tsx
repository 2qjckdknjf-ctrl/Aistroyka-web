"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input, Button, Alert } from "@/components/ui";

const SIGN_IN_TIMEOUT_MS = 15_000;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const start = Date.now();
    try {
      const supabase = createClient();
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{ error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS)
      );
      const { error: err } = await Promise.race([signInPromise, timeoutPromise]);
      if (process.env.NODE_ENV === "development") {
        console.info("[login] signIn completed in", Date.now() - start, "ms", err ? "error" : "ok");
      }
      if (err) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("invalid") && (msg.includes("credentials") || msg.includes("login"))) {
          setError(t("invalidCredentials"));
        } else if (msg.includes("email not confirmed") || msg.includes("confirm your email")) {
          setError(t("emailNotConfirmed"));
        } else {
          setError(t("defaultError"));
        }
        return;
      }
      router.push(next);
      router.refresh();
    } catch (thrown) {
      const isTimeout = thrown instanceof Error && thrown.message === "timeout";
      if (process.env.NODE_ENV === "development") {
        console.warn("[login] signIn failed", isTimeout ? "timeout" : thrown);
      }
      if (isTimeout) {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError(t("defaultError"));
      }
    } finally {
      setLoading(false);
    }
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
            {error && <Alert message={error} style="error" />}
            <Button type="submit" loading={loading} disabled={loading} className="w-full">
              {loading ? t("signingIn") : t("signIn")}
            </Button>
          </form>
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
