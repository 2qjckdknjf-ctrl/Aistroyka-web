"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";

const LOGO_SRC = "/brand/aistroyka-logo.png";
const ICON_SRC = "/brand/aistroyka-icon.png";
const WORDMARK_SRC = "/brand/wordmark/aistroyka-wordmark.png";
const LOGO_ALT = "Aistroyka";

export type LogoVariant = "full" | "wordmark" | "icon";

type LogoProps = {
  href: string;
  className?: string;
  /** Height in pixels for full/wordmark; width auto. */
  height?: number;
  /** full = helmet+wordmark (hero, sidebar, auth); wordmark = header; icon = collapsed/favicon. */
  variant?: LogoVariant;
  /** @deprecated Use variant="icon" instead. */
  iconOnly?: boolean;
  priority?: boolean;
  onClick?: () => void;
};

export function Logo({
  href,
  className = "",
  height = 28,
  variant,
  iconOnly = false,
  priority = false,
  onClick,
}: LogoProps) {
  const effectiveVariant = variant ?? (iconOnly ? "icon" : "full");
  const src =
    effectiveVariant === "icon" ? ICON_SRC : effectiveVariant === "wordmark" ? WORDMARK_SRC : LOGO_SRC;
  const isIcon = effectiveVariant === "icon";
  return (
    <Link href={href} className={`inline-flex shrink-0 items-center ${className}`} aria-label={LOGO_ALT} onClick={onClick}>
      <Image
        src={src}
        alt={LOGO_ALT}
        width={isIcon ? 32 : effectiveVariant === "wordmark" ? 120 : 140}
        height={32}
        className={isIcon ? "h-8 w-8 object-contain" : "h-auto w-auto max-h-10 object-contain"}
        style={isIcon ? {} : { height: `${height}px`, width: "auto" }}
        priority={priority}
        unoptimized
      />
    </Link>
  );
}
