"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { Input, Button, Alert } from "@/components/ui";

const RESET_PASSWORD_ENDPOINT = "/api/v1/auth/reset-password";

function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [envOk, setEnvOk] = useState<boolean | null>(null);

  useEffect(() => {
    setEnvOk(hasSupabaseEnv());
    if (!hasSupabaseEnv()) {
      setCheckingSession(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session));
      setCheckingSession(false);
    }).catch(() => {
      setSessionReady(false);
      setCheckingSession(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(RESET_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          setSessionReady(false);
        }
        setError(data.message ?? t("defaultError"));
        return;
      }
      router.push("/login?reset=success");
    } catch {
      setError(t("defaultError"));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t("checkingResetLink")}
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-aistroyka-bg-primary px-aistroyka-4 py-aistroyka-8 sm:py-aistroyka-12">
      <div className="w-full max-w-[400px]">
        <div className="card-elevated">
          <div className="mb-aistroyka-4 flex justify-center">
            <Image src="/brand/aistroyka-logo.png" alt={t("tagline")} width={140} height={48} className="h-12 w-auto object-contain" unoptimized />
          </div>
          <div className="mb-aistroyka-6 text-center sm:mb-aistroyka-8">
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">{t("resetPasswordTitle")}</h1>
            <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("resetPasswordHint")}</p>
          </div>
          {envOk === false ? (
            <Alert message="Supabase env missing." style="error" className="mb-aistroyka-4" />
          ) : null}
          {!sessionReady ? (
            <div className="space-y-aistroyka-4">
              <Alert message={t("invalidOrExpiredResetLink")} style="error" />
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-aistroyka-md border border-aistroyka-border-subtle bg-aistroyka-bg-secondary px-aistroyka-4 py-aistroyka-3 text-aistroyka-subheadline font-medium text-aistroyka-text-primary hover:bg-aistroyka-bg-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
              >
                {t("requestNewResetLink")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-aistroyka-5">
              <Input
                id="password"
                type="password"
                name="password"
                label={t("newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                required
              />
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                label={t("confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                required
              />
              {error ? <Alert message={error} style="error" /> : null}
              <Button type="submit" loading={loading} disabled={loading || envOk === false} className="w-full">
                {loading ? t("updatingPassword") : t("updatePassword")}
              </Button>
            </form>
          )}
          <p className="mt-aistroyka-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
            <Link href="/login" className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm">
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-aistroyka-4 py-aistroyka-8 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">{tCommon("loading")}</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
