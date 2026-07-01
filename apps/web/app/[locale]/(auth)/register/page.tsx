"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input, Button, Alert } from "@/components/ui";

const SIGN_UP_TIMEOUT_MS = 15_000;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const signUpPromise = supabase.auth.signUp({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), SIGN_UP_TIMEOUT_MS)
      );
      const { error: err } = await Promise.race([signUpPromise, timeoutPromise]);
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
      setMessage(t("checkEmail"));
      router.refresh();
    } catch (thrown) {
      const isTimeout = thrown instanceof Error && thrown.message === "timeout";
      setError(isTimeout ? "Request timed out. Please check your connection and try again." : t("defaultError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-aistroyka-bg-primary px-aistroyka-4 py-aistroyka-8 sm:py-aistroyka-12">
      <div className="w-full max-w-[400px]">
        <div className="card-elevated">
          <div className="mb-aistroyka-6 text-center sm:mb-aistroyka-8">
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">{t("register")}</h1>
            <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("tagline")}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-aistroyka-5">
            <Input id="email" type="email" label={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input id="password" type="password" label={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            {error && <Alert message={error} style="error" />}
            {message && <Alert message={message} style="success" />}
            <Button type="submit" loading={loading} disabled={loading} className="w-full">
              {loading ? t("creatingAccount") : t("registerButton")}
            </Button>
          </form>
          <p className="mt-aistroyka-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm">
              {t("logIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
