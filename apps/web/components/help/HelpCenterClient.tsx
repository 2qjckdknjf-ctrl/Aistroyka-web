"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Input } from "@/components/ui";
import { HELP_ARTICLE_CATALOG, type HelpArticleCatalogItem, type HelpRole } from "@/lib/help/help-catalog";
import { HelpStartChecklist } from "./HelpStartChecklist";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Article = {
  id: HelpArticleCatalogItem["id"];
  href: string;
  title: string;
  summary: string;
  bullets: string[];
};

type SmartAnswer = {
  id: string;
  title: string;
  summary: string;
  answer: string;
  href: string;
};

type SmartSuggestion = {
  id: string;
  title: string;
  href: string;
};

function detectHelpRole(pathname: string): HelpRole {
  if (pathname.includes("/admin")) return "admin";
  if (pathname.includes("/client")) return "client";
  if (pathname.includes("/owner")) return "owner";
  return "manager";
}

export function HelpCenterClient() {
  const t = useTranslations("helpCenter");
  const locale = useLocale();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [smartAnswer, setSmartAnswer] = useState<SmartAnswer | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const role = detectHelpRole(pathname);

  const articles = useMemo<Article[]>(
    () =>
      HELP_ARTICLE_CATALOG.map((item) => ({
        id: item.id,
        href: item.href,
        title: t(`articles.${item.id}.title`),
        summary: t(`articles.${item.id}.summary`),
        bullets: [t(`articles.${item.id}.point1`), t(`articles.${item.id}.point2`), t(`articles.${item.id}.point3`)],
      })),
    [t],
  );

  const recommendedArticleIds = useMemo(() => {
    return new Set(
      HELP_ARTICLE_CATALOG.filter((item) => item.roles.includes("all") || item.roles.includes(role)).map((item) => item.id),
    );
  }, [role]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredArticles = articles.filter((article) => {
    if (!normalizedQuery) return true;
    const haystack = [article.title, article.summary, ...article.bullets].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const bestAnswer = useMemo(() => {
    if (!normalizedQuery) return null;
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    let best: { article: Article; score: number } | null = null;

    for (const article of articles) {
      const text = [article.title, article.summary, ...article.bullets].join(" ").toLowerCase();
      const score = words.reduce((sum, word) => (text.includes(word) ? sum + 1 : sum), 0);
      if (score > 0 && (!best || score > best.score)) {
        best = { article, score };
      }
    }

    return best?.article ?? null;
  }, [articles, normalizedQuery]);

  useEffect(() => {
    if (normalizedQuery.length < 3) {
      setSmartAnswer(null);
      setSmartSuggestions([]);
      setSmartLoading(false);
      return;
    }

    const controller = new AbortController();
    setSmartLoading(true);

    async function runSmartSearch() {
      try {
        const response = await fetch("/api/v1/help/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ query: normalizedQuery, locale, role }),
          signal: controller.signal,
        });
        if (!response.ok) {
          setSmartAnswer(null);
          setSmartSuggestions([]);
          return;
        }
        const json = (await response.json()) as {
          answer: SmartAnswer | null;
          suggestions: SmartSuggestion[];
        };
        setSmartAnswer(json.answer ?? null);
        setSmartSuggestions(json.suggestions ?? []);
      } catch {
        setSmartAnswer(null);
        setSmartSuggestions([]);
      } finally {
        setSmartLoading(false);
      }
    }

    runSmartSearch();
    return () => controller.abort();
  }, [locale, normalizedQuery, role]);

  return (
    <section className="space-y-5">
      <DashboardGlassCard className="p-5">
        <h1 className="text-aistroyka-title font-semibold text-aistroyka-text-primary">{t("title")}</h1>
        <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("subtitle")}</p>
        <p className="mt-2 text-aistroyka-caption text-aistroyka-text-tertiary">
          {t("roleHint", { role: t(`roles.${role}`) })}
        </p>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="mt-4"
        />
      </DashboardGlassCard>

      <HelpStartChecklist />

      {smartLoading ? (
        <DashboardGlassCard className="p-5 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("searching")}</DashboardGlassCard>
      ) : null}

      {(smartAnswer || bestAnswer) ? (
        <DashboardGlassCard className="p-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("bestAnswerTitle")}</h2>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {smartAnswer?.summary ?? bestAnswer?.summary}
          </p>
          <p className="mt-3 text-aistroyka-subheadline text-aistroyka-text-primary">
            {smartAnswer?.answer ?? bestAnswer?.bullets[0]}
          </p>
          <Link
            href={smartAnswer?.href ?? bestAnswer?.href ?? "/dashboard/help"}
            className="mt-4 inline-flex text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
          >
            {t("openSection")}
          </Link>
          {smartSuggestions.length > 0 ? (
            <div className="mt-4 border-t border-aistroyka-border-subtle pt-3">
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("relatedTitle")}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {smartSuggestions.map((item) => (
                  <Link key={item.id} href={item.href} className="text-aistroyka-caption text-aistroyka-accent hover:underline">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </DashboardGlassCard>
      ) : null}

      {filteredArticles.length === 0 ? (
        <DashboardGlassCard className="p-5 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("noResults")}</DashboardGlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredArticles.map((article) => (
            <DashboardGlassCard key={article.id} className="p-5">
              <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
                {article.title}
                {recommendedArticleIds.has(article.id) ? (
                  <span className="ml-2 rounded-full bg-aistroyka-accent-light px-2 py-0.5 text-aistroyka-caption font-medium text-aistroyka-accent">
                    {t("recommended")}
                  </span>
                ) : null}
              </h2>
              <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">{article.summary}</p>
              <ul className="mt-3 space-y-2 text-aistroyka-subheadline text-aistroyka-text-primary">
                {article.bullets.map((point) => (
                  <li key={point} className="list-inside list-disc">
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={article.href}
                className="mt-4 inline-flex text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
              >
                {t("openSection")}
              </Link>
            </DashboardGlassCard>
          ))}
        </div>
      )}
    </section>
  );
}
