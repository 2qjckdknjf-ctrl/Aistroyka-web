import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export async function PublicHomeContent() {
  const t = await getTranslations("public.home");
  const tMetrics = await getTranslations("public.homeMetrics");

  const MOCK_METRICS = { projects: "500+", reports: "12K+", insights: "8K+", photos: "45K+" };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" style={{ background: "linear-gradient(180deg, #0B0F19 0%, #05070d 100%)" }}>
        {/* Animated gradient glow behind logo */}
        <div
          className="animate-hero-glow pointer-events-none absolute left-1/2 top-32 -translate-x-1/2 w-[400px] h-[200px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(245,197,24,0.25) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/brand/aistroyka-logo.png"
              alt="AISTROYKA"
              width={180}
              height={60}
              className="h-14 w-auto sm:h-16"
              priority
              unoptimized
            />
          </div>
          <h1 className="font-heading text-[var(--aistroyka-font-large)] font-bold tracking-tight text-[var(--text-main)] sm:text-4xl lg:text-5xl">
            AI that understands construction.
          </h1>
          <p className="mt-4 text-lg text-[var(--text-muted)] sm:text-xl">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Start Project
            </Link>
            <Link href="/ai-demo" className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--radius-main)] border border-[var(--border-main)] bg-white/5 px-6 py-2.5 text-[var(--aistroyka-font-headline)] font-semibold text-[var(--text-main)] transition-colors hover:bg-white/10">
              View Demo
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--radius-main)] border border-[var(--border-main)] bg-transparent px-6 py-2.5 text-[var(--aistroyka-font-headline)] font-semibold text-[var(--text-main)] transition-colors hover:bg-white/5"
            >
              {t("ctaLogin")}
            </Link>
          </div>
        </div>
        {/* Product preview strip */}
        <div className="relative mx-auto mt-14 max-w-5xl px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/projects-showcase" className="block rounded-[var(--radius-main)] border border-[var(--border-main)] bg-white/5 p-6 text-center transition hover:bg-white/10 hover:border-[var(--ai-yellow)]/30">
              <span className="text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--text-main)]">Dashboard</span>
              <p className="mt-1 text-[var(--aistroyka-font-caption)] text-[var(--text-muted)]">Projects, tasks, KPIs</p>
            </Link>
            <Link href="/ai-demo" className="block rounded-[var(--radius-main)] border border-[var(--border-main)] bg-white/5 p-6 text-center transition hover:bg-white/10 hover:border-[var(--ai-yellow)]/30">
              <span className="text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--text-main)]">AI insights</span>
              <p className="mt-1 text-[var(--aistroyka-font-caption)] text-[var(--text-muted)]">Progress, risks, delays</p>
            </Link>
            <Link href="/mobile" className="block rounded-[var(--radius-main)] border border-[var(--border-main)] bg-white/5 p-6 text-center transition hover:bg-white/10 hover:border-[var(--ai-yellow)]/30">
              <span className="text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--text-main)]">Mobile</span>
              <p className="mt-1 text-[var(--aistroyka-font-caption)] text-[var(--text-muted)]">Reports, evidence</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics block */}
      <section className="border-b border-[var(--border-main)] bg-[var(--bg-card)] py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-7xl px-4 text-center text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-secondary)] sm:px-6 lg:px-8">
          {t("trustStrip")}
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-[var(--bg-main)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
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
        <div className="mx-auto max-w-4xl text-center">
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
        <div className="mx-auto max-w-7xl">
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
            <div className="rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-main)] p-6">
              <div className="font-semibold text-[var(--text-main)]">Project manager</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
                Tasks, reports, dashboards, and team coordination.
              </p>
            </div>
            <div className="rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-main)] p-6">
              <div className="font-semibold text-[var(--text-main)]">Field teams</div>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
                Mobile reporting, photo evidence, quick task execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Construction Control */}
      <section className="bg-[var(--bg-main)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8" style={{ background: "linear-gradient(180deg, #0B0F19 0%, #05070d 100%)" }}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("aiSectionTitle")}
          </h2>
          <p className="mt-3 text-[var(--text-muted)]">
            {t("aiSectionSubtitle")}
          </p>
          <Link
            href="/ai-construction-control"
            className="mt-6 inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--radius-main)] bg-[var(--ai-yellow)] px-6 py-2.5 text-[var(--aistroyka-font-headline)] font-semibold text-[var(--ai-dark)] hover:bg-[var(--aistroyka-accent-hover)]"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Mobile */}
      <section className="bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("mobileTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            {t("mobileSubtitle")}
          </p>
          <Link href="/mobile" className="btn-primary mt-6">
            Mobile
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-[var(--bg-main)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("pricingTeaserTitle")}
          </h2>
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--text-muted)]">
            {t("pricingTeaserSubtitle")}
          </p>
          <Link href="/pricing" className="btn-primary mt-6">
            {t("pricingTeaserTitle")}
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" style={{ background: "linear-gradient(180deg, #0B0F19 0%, #05070d 100%)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-[var(--text-main)]">
            {t("finalCtaTitle")}
          </h2>
          <p className="mt-3 text-[var(--text-muted)]">
            {t("finalCtaSubtitle")}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--radius-main)] bg-[var(--ai-yellow)] px-8 py-3 text-[var(--aistroyka-font-headline)] font-semibold text-[var(--ai-dark)] hover:bg-[var(--aistroyka-accent-hover)]"
          >
            {t("finalCtaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}
