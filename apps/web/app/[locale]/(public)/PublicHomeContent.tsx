import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function PublicHomeContent() {
  const t = await getTranslations("public.home");
  const tMetrics = await getTranslations("public.homeMetrics");

  const MOCK_METRICS = { projects: "500+", reports: "12K+", insights: "8K+", photos: "45K+" };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--aistroyka-bg-branded)] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-[var(--aistroyka-font-large)] font-bold tracking-tight text-[var(--aistroyka-text-on-branded)] sm:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-[var(--aistroyka-text-on-branded)]/90 sm:text-xl">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              {t("ctaDemo")}
            </Link>
            <Link href="/ai-demo" className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] border border-white/30 bg-white/10 px-6 py-2.5 text-[var(--aistroyka-font-headline)] font-semibold text-white hover:bg-white/20">
              Try AI demo
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] border border-white/30 bg-transparent px-6 py-2.5 text-[var(--aistroyka-font-headline)] font-semibold text-white hover:bg-white/10"
            >
              {t("ctaLogin")}
            </Link>
          </div>
        </div>
        {/* Product preview strip: dashboard, AI, mobile */}
        <div className="mx-auto mt-14 max-w-5xl px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/projects-showcase" className="block rounded-[var(--aistroyka-radius-card)] border border-white/20 bg-white/5 p-6 text-center transition hover:bg-white/10">
              <span className="text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--aistroyka-text-on-branded)]">Dashboard</span>
              <p className="mt-1 text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-on-branded)]/70">Projects, tasks, KPIs</p>
            </Link>
            <Link href="/ai-demo" className="block rounded-[var(--aistroyka-radius-card)] border border-white/20 bg-white/5 p-6 text-center transition hover:bg-white/10">
              <span className="text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--aistroyka-text-on-branded)]">AI insights</span>
              <p className="mt-1 text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-on-branded)]/70">Progress, risks, delays</p>
            </Link>
            <Link href="/mobile" className="block rounded-[var(--aistroyka-radius-card)] border border-white/20 bg-white/5 p-6 text-center transition hover:bg-white/10">
              <span className="text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--aistroyka-text-on-branded)]">Mobile</span>
              <p className="mt-1 text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-on-branded)]/70">Reports, evidence</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics block */}
      <section className="border-b border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-text-secondary)]">
            {tMetrics("title")}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-[var(--aistroyka-font-title2)] font-bold text-[var(--aistroyka-accent)]">{MOCK_METRICS.projects}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">{tMetrics("projectsMonitored")}</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--aistroyka-font-title2)] font-bold text-[var(--aistroyka-accent)]">{MOCK_METRICS.reports}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">{tMetrics("dailyReportsAnalyzed")}</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--aistroyka-font-title2)] font-bold text-[var(--aistroyka-accent)]">{MOCK_METRICS.insights}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">{tMetrics("aiInsightsGenerated")}</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--aistroyka-font-title2)] font-bold text-[var(--aistroyka-accent)]">{MOCK_METRICS.photos}</div>
              <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">{tMetrics("photosProcessed")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-secondary)] sm:px-6 lg:px-8">
          {t("trustStrip")}
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-[var(--aistroyka-bg-primary)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("painTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
            {t("painSubtitle")}
          </p>
        </div>
      </section>

      {/* Solution overview */}
      <section className="bg-[var(--aistroyka-surface)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("solutionTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
            {t("solutionSubtitle")}
          </p>
        </div>
      </section>

      {/* Key modules - cards */}
      <section className="bg-[var(--aistroyka-bg-primary)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("modulesTitle")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(["projectManagement", "tasks", "dailyReports", "photoVideo"] as const).map((key) => (
              <div
                key={key}
                className="card rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
              >
                <div className="text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-text-primary)]">
                  {t(`modules.${key}`)}
                </div>
                <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
                  {key === "projectManagement" && "Projects, structure, and progress at a glance."}
                  {key === "tasks" && "Assign, track, and complete tasks with deadlines."}
                  {key === "dailyReports" && "Daily reports from the field with evidence."}
                  {key === "photoVideo" && "Photo and video evidence linked to tasks and reports."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based value - reuse features copy */}
      <section className="bg-[var(--aistroyka-surface)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("rolesTitle")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-6">
              <div className="font-semibold text-[var(--aistroyka-text-primary)]">Developer / GC</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
                Full visibility, risk and delay control, AI insights.
              </p>
            </div>
            <div className="card p-6">
              <div className="font-semibold text-[var(--aistroyka-text-primary)]">Project manager</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
                Tasks, reports, dashboards, and team coordination.
              </p>
            </div>
            <div className="card p-6">
              <div className="font-semibold text-[var(--aistroyka-text-primary)]">Field teams</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
                Mobile reporting, photo evidence, quick task execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Construction Control */}
      <section className="bg-[var(--aistroyka-bg-branded)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-on-branded)]">
            {t("aiSectionTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-text-on-branded)]/90">
            {t("aiSectionSubtitle")}
          </p>
          <Link
            href="/ai-construction-control"
            className="mt-6 inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] bg-white px-6 py-2.5 text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-bg-branded)] hover:bg-white/90"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Mobile */}
      <section className="bg-[var(--aistroyka-bg-primary)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("mobileTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
            {t("mobileSubtitle")}
          </p>
          <Link href="/mobile" className="btn-primary mt-6">
            Mobile
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-[var(--aistroyka-surface)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("pricingTeaserTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
            {t("pricingTeaserSubtitle")}
          </p>
          <Link href="/pricing" className="btn-primary mt-6">
            {t("pricingTeaserTitle")}
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--aistroyka-bg-branded)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-on-branded)]">
            {t("finalCtaTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-text-on-branded)]/90">
            {t("finalCtaSubtitle")}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] bg-[var(--aistroyka-accent)] px-8 py-3 text-[var(--aistroyka-font-headline)] font-semibold text-white hover:bg-[var(--aistroyka-accent-hover)]"
          >
            {t("finalCtaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}
