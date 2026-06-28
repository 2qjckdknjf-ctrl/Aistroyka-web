import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { LiquidGlass } from "./LiquidGlass";

type GlassLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  className?: string;
  linkClassName?: string;
  intensity?: "subtle" | "medium" | "strong";
  pill?: boolean;
  /** Demo store-button layout: small caption + strong label */
  storeLayout?: { caption: string; label: string };
  "data-testid"?: string;
  onClick?: ComponentProps<typeof Link>["onClick"];
};

const linkFocusClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

/**
 * Navigation / CTA link wrapped in interactive glass (demo store-btn parity).
 */
export function GlassLink({
  href,
  children,
  className = "",
  linkClassName = "",
  intensity = "medium",
  pill = false,
  storeLayout,
  "data-testid": testId,
  onClick,
}: GlassLinkProps) {
  return (
    <LiquidGlass
      variant="control"
      intensity={intensity}
      pill={pill}
      motion={["interactive"]}
      className={className}
      contentClassName="p-0"
    >
      <Link
        href={href}
        data-testid={testId}
        onClick={onClick}
        className={[
          "block min-h-[var(--aistroyka-touch-min)] rounded-[inherit] text-aistroyka-text-primary",
          storeLayout ? "px-5 py-3" : "px-5 py-2.5 text-sm font-semibold",
          linkFocusClass,
          linkClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {storeLayout ? (
          <span className="flex flex-col items-start gap-0.5">
            <small className="text-[10px] font-medium text-aistroyka-text-tertiary">{storeLayout.caption}</small>
            <strong className="text-sm font-semibold">{storeLayout.label}</strong>
          </span>
        ) : (
          children
        )}
      </Link>
    </LiquidGlass>
  );
}
