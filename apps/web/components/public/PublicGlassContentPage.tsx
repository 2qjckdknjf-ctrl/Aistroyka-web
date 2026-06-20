import type { ReactNode } from "react";
import { PublicRevealGlassCard } from "./PublicRevealGlassCard";

type PublicGlassContentPageProps = {
  title: string;
  description?: string;
  children: ReactNode;
  maxWidthClass?: string;
};

/** Standard glass-framed content page (terms, privacy, docs index, etc.). */
export function PublicGlassContentPage({
  title,
  description,
  children,
  maxWidthClass = "max-w-3xl",
}: PublicGlassContentPageProps) {
  return (
    <div className={`mx-auto min-w-0 ${maxWidthClass} px-4 py-16 sm:px-6 sm:py-20 lg:px-8`}>
      <PublicRevealGlassCard intensity="strong">
        <h1 className="text-[var(--aistroyka-font-title)] font-bold text-aistroyka-text-primary">{title}</h1>
        {description ? (
          <p className="mt-4 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{description}</p>
        ) : null}
      </PublicRevealGlassCard>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}
