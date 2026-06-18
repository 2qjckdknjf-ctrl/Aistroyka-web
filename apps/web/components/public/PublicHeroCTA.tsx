import { Link } from "@/i18n/navigation";

type PublicHeroCTAProps = {
  primaryLabel: string;
  secondaryLabel: string;
  presentationLabel: string;
};

export function PublicHeroCTA({ primaryLabel, secondaryLabel, presentationLabel }: PublicHeroCTAProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Link
        href="/dashboard"
        className="btn-primary min-w-0 flex-1 basis-[min(100%,14rem)] text-center sm:flex-none sm:basis-auto"
        data-testid="cta.public.hero.launch-pilot"
      >
        {primaryLabel}
      </Link>
      <Link
        href="/contact"
        className="btn-secondary min-w-0 flex-1 basis-[min(100%,14rem)] text-center sm:flex-none sm:basis-auto"
        data-testid="cta.public.hero.contact"
      >
        {secondaryLabel}
      </Link>
      <Link
        href="/contact"
        className="rounded-[var(--aistroyka-radius-lg)] px-1 py-1 text-center text-sm font-medium text-aistroyka-text-secondary underline-offset-4 outline-none hover:text-aistroyka-accent hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:ml-1"
        data-testid="cta.public.hero.presentation"
      >
        {presentationLabel}
      </Link>
    </div>
  );
}
