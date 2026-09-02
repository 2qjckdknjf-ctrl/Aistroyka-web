"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Alert } from "@/components/ui";
import { AuthProviderButtons } from "@/components/auth/AuthProviderButtons";
import { CanonSurface } from "@/components/canon/CanonSurface";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

type MethodsResponse = {
  methods: {
    email: boolean;
    apple: boolean;
    telegram: boolean;
    google: boolean;
  };
  linkedCount: number;
};

async function fetchMethods(): Promise<MethodsResponse> {
  const res = await fetch("/api/v1/auth/methods", { credentials: "include" });
  if (!res.ok) {
    throw new Error("load_failed");
  }
  return res.json();
}

async function unlinkProvider(provider: "apple" | "telegram" | "google"): Promise<MethodsResponse> {
  const res = await fetch("/api/v1/auth/methods", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unlink", provider }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "unlink_failed");
  }
  return data as MethodsResponse;
}

export function AuthMethodsSettingsCard({ skin = "default" }: { skin?: "default" | "canon" }) {
  const t = useTranslations("auth");
  const isCanon = skin === "canon";
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MethodsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<"apple" | "telegram" | "google" | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    void fetchMethods()
      .then((result) => {
        setData(result);
      })
      .catch(() => {
        setError(t("methodsLoadFailed"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  async function handleUnlink(provider: "apple" | "telegram" | "google") {
    setError(null);
    setUnlinking(provider);
    try {
      const next = await unlinkProvider(provider);
      setData(next);
    } catch (thrown) {
      const message = thrown instanceof Error ? thrown.message : "unlink_failed";
      if (message === "last_method_forbidden") {
        setError(t("unlinkLastMethodForbidden"));
      } else {
        setError(t("unlinkFailed"));
      }
    } finally {
      setUnlinking(null);
    }
  }

  async function handleDeleteAccount() {
    if (typeof window !== "undefined" && !window.confirm(t("deleteAccountConfirm"))) {
      return;
    }
    setError(null);
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/v1/me", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) {
        throw new Error("delete_failed");
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setError(t("deleteAccountFailed"));
    } finally {
      setDeletingAccount(false);
    }
  }

  const nextToComeBack = `/${locale}/dashboard/settings/auth`;

  return (
    <CanonSurface isCanon={isCanon} className="p-5">
      <h1 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("linkedMethodsTitle")}
      </h1>
      <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("linkedMethodsHint")}</p>

      {loading ? (
        <p className="mt-4 text-sm text-aistroyka-text-secondary">{t("loadingMethods")}</p>
      ) : null}

      {error ? <Alert message={error} style="error" className="mt-4" /> : null}

      {data ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodEmail")}</span>
            <span className="text-aistroyka-text-secondary">{data.methods.email ? t("methodLinked") : t("methodNotLinked")}</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodApple")}</span>
            <div className="flex items-center gap-2">
              <span className="text-aistroyka-text-secondary">{data.methods.apple ? t("methodLinked") : t("methodNotLinked")}</span>
              {data.methods.apple ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={unlinking === "apple"}
                  onClick={() => {
                    void handleUnlink("apple");
                  }}
                >
                  {t("unlink")}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodGoogle")}</span>
            <div className="flex items-center gap-2">
              <span className="text-aistroyka-text-secondary">{data.methods.google ? t("methodLinked") : t("methodNotLinked")}</span>
              {data.methods.google ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={unlinking === "google"}
                  onClick={() => {
                    void handleUnlink("google");
                  }}
                >
                  {t("unlink")}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodTelegram")}</span>
            <div className="flex items-center gap-2">
              <span className="text-aistroyka-text-secondary">{data.methods.telegram ? t("methodLinked") : t("methodNotLinked")}</span>
              {data.methods.telegram ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={unlinking === "telegram"}
                  onClick={() => {
                    void handleUnlink("telegram");
                  }}
                >
                  {t("unlink")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <AuthProviderButtons
          mode="login"
          appleIntent="link"
          nextPath={nextToComeBack}
          hideEmailButton
          onContinueEmail={() => {
            // no-op in settings; email is already the primary method
          }}
        />
      </div>

      <div className="mt-8 border-t border-aistroyka-border-subtle pt-5">
        <h2 className="text-sm font-semibold text-aistroyka-text-primary">{t("deleteAccountTitle")}</h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("deleteAccountHint")}</p>
        <Button
          className="mt-3"
          size="sm"
          variant="destructive"
          loading={deletingAccount}
          data-testid="cta.dashboard.deleteAccount"
          onClick={() => {
            void handleDeleteAccount();
          }}
        >
          {t("deleteAccountButton")}
        </Button>
      </div>
    </CanonSurface>
  );
}
