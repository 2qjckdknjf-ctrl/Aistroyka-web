import { getTranslations } from "next-intl/server";
import {
  PublicCTASection,
  PublicHeroCTA,
  PublicHeroLens,
  PublicHeroMetrics,
  PublicRelatedLinksSection,
  PublicRevealGlassCard,
} from "@/components/public";
import { GlassLink } from "@/components/design/liquid-glass";

const HOME_RELATED_LINKS = [
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/pricing", titleKey: "relatedPricing", descKey: "relatedPricingDesc", linkKey: "linkPricing" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

const MODULE_KEYS = ["projectManagement", "tasks", "dailyReports", "photoVideo"] as const;

export async function PublicHomeContent() {
  const t = await getTranslations("public.home");
  const tCta = await getTranslations("public.cta");
  const tMetrics = await getTranslations("public.homeMetrics");

  return (
    <>
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
                { value: tMetrics("projectsMonitored"), label: tMetrics("projectsMonitoredDesc") },
                { value: tMetrics("dailyReportsAnalyzed"), label: tMetrics("dailyReportsAnalyzedDesc") },
                { value: tMetrics("aiInsightsGenerated"), label: tMetrics("aiInsightsGeneratedDesc") },
                { value: tMetrics("photosProcessed"), label: tMetrics("photosProcessedDesc") },
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

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto min-w-0 max-w-5xl">
          <PublicRevealGlassCard intensity="subtle">
            <h2 className="text-center text-[var(--aistroyka-font-headline)] font-semibold text-aistroyka-text-primary">
              {tMetrics("title")}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  [tMetrics("projectsMonitored"), tMetrics("projectsMonitoredDesc")],
                  [tMetrics("dailyReportsAnalyzed"), tMetrics("dailyReportsAnalyzedDesc")],
                  [tMetrics("aiInsightsGenerated"), tMetrics("aiInsightsGeneratedDesc")],
                  [tMetrics("photosProcessed"), tMetrics("photosProcessedDesc")],
                ] as const
              ).map(([title, desc]) => (
                <PublicRevealGlassCard key={title} interactive intensity="subtle">
                  <div className="text-center">
                    <div className="font-heading text-[var(--aistroyka-font-headline)] font-semibold text-aistroyka-accent">
                      {title}
                    </div>
                    <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                      {desc}
                    </div>
                  </div>
                </PublicRevealGlassCard>
              ))}
            </div>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto min-w-0 max-w-7xl">
          <PublicRevealGlassCard intensity="subtle">
            <p className="text-center text-[var(--aistroyka-font-subheadline)] text-aistroyka-text-secondary">
              {t("trustStrip")}
            </p>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-3xl">
          <PublicRevealGlassCard>
            <h2 className="text-center font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
              {t("painTitle")}
            </h2>
            <p className="mt-3 text-center text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
              {t("painSubtitle")}
            </p>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl">
          <PublicRevealGlassCard>
            <h2 className="text-center font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
              {t("solutionTitle")}
            </h2>
            <p className="mt-3 text-center text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
              {t("solutionSubtitle")}
            </p>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[13px] font-semibold uppercase tracking-[0.02em] text-aistroyka-accent">
              {t("modulesTitle")}
            </span>
            <h2 className="mt-3 font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
              {t("modulesTitle")}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULE_KEYS.map((key) => (
              <PublicRevealGlassCard key={key} interactive>
                <h3 className="text-[var(--aistroyka-font-headline)] font-semibold text-aistroyka-text-primary">
                  {t(`modules.${key}`)}
                </h3>
                <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                  {key === "projectManagement" && t("moduleDescProjectManagement")}
                  {key === "tasks" && t("moduleDescTasks")}
                  {key === "dailyReports" && t("moduleDescDailyReports")}
                  {key === "photoVideo" && t("moduleDescPhotoVideo")}
                </p>
              </PublicRevealGlassCard>
            ))}
          </div>
          <p className="mt-8 text-center">
            <GlassLink href="/features" pill intensity="subtle" linkClassName="text-sm">
              {t("seeAllFeatures")}
            </GlassLink>
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-7xl">
          <h2 className="text-center text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
            {t("rolesTitle")}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PublicRevealGlassCard>
              <div className="font-semibold text-aistroyka-text-primary">{t("roleDeveloperGcTitle")}</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                {t("roleDeveloperGcBody")}
              </p>
            </PublicRevealGlassCard>
            <PublicRevealGlassCard>
              <div className="font-semibold text-aistroyka-text-primary">{t("roleProjectManagerTitle")}</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                {t("roleProjectManagerBody")}
              </p>
            </PublicRevealGlassCard>
            <PublicRevealGlassCard>
              <div className="font-semibold text-aistroyka-text-primary">{t("roleFieldTeamsTitle")}</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                {t("roleFieldTeamsBody")}
              </p>
            </PublicRevealGlassCard>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl">
          <PublicRevealGlassCard intensity="strong">
            <h2 className="text-center font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
              {t("aiSectionTitle")}
            </h2>
            <p className="mt-3 text-center text-aistroyka-text-secondary">{t("aiSectionSubtitle")}</p>
            <div className="mt-6 flex justify-center">
              <GlassLink href="/ai-construction-control">{t("learnMore")}</GlassLink>
            </div>
            <p className="mt-4 text-center">
              <GlassLink href="/ai-demo" intensity="subtle" pill linkClassName="text-sm">
                {t("tryMockAnalysis")}
              </GlassLink>
            </p>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl">
          <PublicRevealGlassCard>
            <h2 className="text-center font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
              {t("mobileTitle")}
            </h2>
            <p className="mt-3 text-center text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
              {t("mobileSubtitle")}
            </p>
            <div className="mt-6 flex justify-center">
              <GlassLink href="/mobile">{t("mobileCta")}</GlassLink>
            </div>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto min-w-0 max-w-3xl">
          <PublicRevealGlassCard>
            <h2 className="text-center font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
              {t("pricingTeaserTitle")}
            </h2>
            <p className="mt-3 text-center text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
              {t("pricingTeaserSubtitle")}
            </p>
            <div className="mt-6 flex justify-center">
              <GlassLink href="/pricing">{t("pricingTeaserCta")}</GlassLink>
            </div>
          </PublicRevealGlassCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto min-w-0 max-w-7xl">
          <PublicRelatedLinksSection
            headingId="home-related-heading"
            title={t("relatedTitle")}
            subtitle={t("relatedSubtitle")}
            links={HOME_RELATED_LINKS.map(({ href, titleKey, descKey, linkKey }) => ({
              href,
              title: t(titleKey),
              description: t(descKey),
              linkLabel: t(linkKey),
            }))}
          />
        </div>
      </section>

      <PublicCTASection
        variant="floating"
        title={t("finalCtaTitle")}
        subtitle={t("finalCtaSubtitle")}
        testIdPrefix="cta.public.home"
      />
    </>
  );
}
