import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function PublicHomeContent() {
  const t = await getTranslations("public.home");
  const tMetrics = await getTranslations("public.homeMetrics");
  const tNav = await getTranslations("public.nav");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-[var(--aistroyka-neural-core)] opacity-20 blur-3xl animate-neural-pulse" />
          <div className="absolute -right-28 bottom-4 h-96 w-96 rounded-full bg-[var(--aistroyka-neural-accent)] opacity-20 blur-3xl animate-neural-drift" />
        </div>

        <div className="public-shell relative mx-auto min-w-0 max-w-6xl rounded-[var(--aistroyka-radius-xxl)] px-4 py-10 sm:px-10 sm:py-16">
          <div className="max-w-3xl min-w-0">
            <div className="public-badge mb-6 inline-flex max-w-full flex-wrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] sm:px-4 sm:tracking-[0.16em]">
              {t("neuralConstructionControl")}
            </div>
            <h1 className="text-balance font-heading text-3xl font-semibold uppercase tracking-[0.04em] text-aistroyka-text-primary sm:text-5xl sm:tracking-[0.06em] lg:text-6xl">
              <span className="text-aistroyka-accent">AISTROYKA</span>{" "}
              <span className="text-aistroyka-text-primary">{t("heroTitle")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-[var(--aistroyka-font-headline)] text-aistroyka-text-secondary sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary min-w-0 flex-1 basis-[min(100%,14rem)] sm:flex-none sm:basis-auto">
                {tNav("requestDemo")}
              </Link>
              <Link href="/ai-demo" className="btn-secondary min-w-0 flex-1 basis-[min(100%,14rem)] sm:flex-none sm:basis-auto">
                {tNav("aiDemo")}
              </Link>
            </div>
          </div>

          <div className="mt-12 grid min-w-0 gap-4 sm:grid-cols-3">
            <Link href="/projects-showcase" className="public-card-motion min-w-0 rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-surface px-4 py-4 sm:px-5">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-aistroyka-accent">{t("heroCardDashboardTitle")}</div>
              <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("heroCardDashboardSubtitle")}</p>
            </Link>
            <Link href="/ai-construction-control" className="public-card-motion min-w-0 rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-surface px-4 py-4 sm:px-5">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-aistroyka-accent">{t("heroCardAiTitle")}</div>
              <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("heroCardAiSubtitle")}</p>
            </Link>
            <Link href="/mobile" className="public-card-motion min-w-0 rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-surface px-4 py-4 sm:px-5">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-aistroyka-accent">{t("heroCardMobileTitle")}</div>
              <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("heroCardMobileSubtitle")}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities block */}
      <section className="border-b border-[var(--border-main)] bg-[var(--bg-card)] py-10">
        <div className="mx-auto min-w-0 max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[var(--aistroyka-font-headline)] font-semibold text-[var(--text-muted)]">
            {tMetrics("title")}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-subheadline)] font-bold text-[var(--ai-yellow)]">{tMetrics("projectsMonitored")}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("projectsMonitoredDesc")}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-subheadline)] font-bold text-[var(--ai-yellow)]">{tMetrics("dailyReportsAnalyzed")}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("dailyReportsAnalyzedDesc")}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-subheadline)] font-bold text-[var(--ai-yellow)]">{tMetrics("aiInsightsGenerated")}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("aiInsightsGeneratedDesc")}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-subheadline)] font-bold text-[var(--ai-yellow)]">{tMetrics("photosProcessed")}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("photosProcessedDesc")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] py-6">
        <div className="mx-auto min-w-0 max-w-7xl px-4 text-center text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-secondary)] sm:px-6 lg:px-8">
          {t("trustStrip")}
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-[var(--bg-main)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-3xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("painTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            {t("painSubtitle")}
          </p>
        </div>
      </section>

      {/* Solution overview */}
      <section className="bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("solutionTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            {t("solutionSubtitle")}
          </p>
        </div>
      </section>

      {/* Key modules - cards */}
      <section className="bg-[var(--bg-main)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-7xl">
          <h2 className="font-heading text-center text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("modulesTitle")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(["projectManagement", "tasks", "dailyReports", "photoVideo"] as const).map((key) => (
              <div
                key={key}
                className="rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 shadow-[var(--aistroyka-shadow-e1)] transition-all hover:shadow-[var(--aistroyka-shadow-e2)] hover:border-[var(--ai-yellow)]/20"
              >
                <div className="text-[var(--aistroyka-font-headline)] font-semibold text-[var(--text-main)]">
                  {t(`modules.${key}`)}
                </div>
                <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
                  {key === "projectManagement" && t("moduleDescProjectManagement")}
                  {key === "tasks" && t("moduleDescTasks")}
                  {key === "dailyReports" && t("moduleDescDailyReports")}
                  {key === "photoVideo" && t("moduleDescPhotoVideo")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based value - reuse features copy */}
      <section className="bg-[var(--aistroyka-surface)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-7xl">
          <h2 className="text-center text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("rolesTitle")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-6">
              <div className="font-semibold text-[var(--aistroyka-text-primary)]">{t("roleDeveloperGcTitle")}</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
                {t("roleDeveloperGcBody")}
              </p>
            </div>
            <div className="rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-main)] p-6">
              <div className="font-semibold text-[var(--text-main)]">{t("roleProjectManagerTitle")}</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
                {t("roleProjectManagerBody")}
              </p>
            </div>
            <div className="rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-main)] p-6">
              <div className="font-semibold text-[var(--text-main)]">{t("roleFieldTeamsTitle")}</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
                {t("roleFieldTeamsBody")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Construction Control */}
      <section className="bg-aistroyka-bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("aiSectionTitle")}
          </h2>
          <p className="mt-3 text-[var(--text-muted)]">
            {t("aiSectionSubtitle")}
          </p>
          <Link href="/ai-construction-control" className="btn-primary mt-6 inline-flex max-w-full sm:px-6">
            {t("learnMore")}
          </Link>
        </div>
      </section>

      {/* Mobile */}
      <section className="bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("mobileTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            {t("mobileSubtitle")}
          </p>
          <Link href="/mobile" className="btn-primary mx-auto mt-6 inline-flex max-w-full">
            {t("mobileCta")}
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-[var(--bg-main)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-3xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("pricingTeaserTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            {t("pricingTeaserSubtitle")}
          </p>
          <Link href="/pricing" className="btn-primary mx-auto mt-6 inline-flex max-w-full">
            {t("pricingTeaserTitle")}
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-aistroyka-bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-3xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("finalCtaTitle")}
          </h2>
          <p className="mt-3 text-[var(--text-muted)]">
            {t("finalCtaSubtitle")}
          </p>
          <Link href="/contact" className="btn-primary mt-6 inline-flex max-w-full sm:px-8">
            {t("finalCtaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}
