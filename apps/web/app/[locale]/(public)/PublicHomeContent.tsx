import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicCTASection, PublicHeroCTA, PublicHeroLens, PublicHeroMetrics } from "@/components/public";

export async function PublicHomeContent() {
  const t = await getTranslations("public.home");
  const tCta = await getTranslations("public.cta");
  const tMetrics = await getTranslations("public.homeMetrics");

  const MOCK_METRICS = { projects: "500+", reports: "12K+", insights: "8K+", photos: "45K+" };

  return (
    <>
      {/* Hero — LG-2A glass lens + operational chips */}
      <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-24">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,24rem)] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <div className="public-badge mb-5 inline-flex max-w-full flex-wrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] sm:px-4 sm:tracking-[0.16em]">
              {t("neuralConstructionControl")}
            </div>
            <h1 className="text-balance font-heading text-3xl font-semibold uppercase tracking-[0.04em] text-aistroyka-text-primary sm:text-5xl sm:tracking-[0.06em] lg:text-[3.25rem] lg:leading-tight">
              <span className="text-aistroyka-accent">AISTROYKA</span>{" "}
              <span className="text-aistroyka-text-primary">{t("heroTitle")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[var(--aistroyka-font-headline)] text-aistroyka-text-secondary sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <PublicHeroCTA
              primaryLabel={tCta("launchPilot")}
              secondaryLabel={tCta("contactUs")}
              presentationLabel={tCta("getPresentation")}
              testIdPrefix="cta.public.home.hero"
            />
            <PublicHeroMetrics
              chips={[
                { value: MOCK_METRICS.projects, label: tMetrics("projectsMonitored") },
                { value: MOCK_METRICS.reports, label: tMetrics("dailyReportsAnalyzed") },
                { value: MOCK_METRICS.insights, label: tMetrics("aiInsightsGenerated") },
                { value: MOCK_METRICS.photos, label: tMetrics("photosProcessed") },
              ]}
            />
          </div>

          <PublicHeroLens
            label={t("heroLensLabel")}
            title={t("heroLensTitle")}
            stats={[
              { label: t("heroLensProgressLabel"), value: t("heroLensProgressValue") },
              { label: t("heroLensRiskLabel"), value: t("heroLensRiskValue"), tone: "warning" },
              { label: t("heroLensReportsLabel"), value: t("heroLensReportsValue") },
            ]}
            streamLines={[t("heroLensStream1"), t("heroLensStream2"), t("heroLensStream3")]}
          />
        </div>
      </section>

      {/* Metrics block */}
      <section className="border-b border-[var(--border-main)] bg-[var(--bg-card)] py-10">
        <div className="mx-auto min-w-0 max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[var(--aistroyka-font-headline)] font-semibold text-[var(--text-muted)]">
            {tMetrics("title")}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-title2)] font-bold text-[var(--ai-yellow)]">{MOCK_METRICS.projects}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("projectsMonitored")}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-title2)] font-bold text-[var(--ai-yellow)]">{MOCK_METRICS.reports}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("dailyReportsAnalyzed")}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-title2)] font-bold text-[var(--ai-yellow)]">{MOCK_METRICS.insights}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("aiInsightsGenerated")}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-[var(--aistroyka-font-title2)] font-bold text-[var(--ai-yellow)]">{MOCK_METRICS.photos}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">{tMetrics("photosProcessed")}</div>
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
          <p className="mt-8 text-center text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            <Link
              href="/features"
              className="font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {t("seeAllFeatures")}
            </Link>
          </p>
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

      <PublicCTASection
        variant="band"
        title={t("finalCtaTitle")}
        subtitle={t("finalCtaSubtitle")}
        testIdPrefix="cta.public.home"
      />
    </>
  );
}
