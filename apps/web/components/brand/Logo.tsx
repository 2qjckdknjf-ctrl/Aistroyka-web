"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/brand/aistroyka-logo.svg";
const ICON_SRC = "/brand/aistroyka-icon.svg";
const LOGO_ALT = "Aistroyka";

type LogoProps = {
  href: string;
  className?: string;
  /** Height in pixels for full logo; width auto. */
  height?: number;
  /** For icon-only (e.g. collapsed sidebar): square icon. */
  iconOnly?: boolean;
  priority?: boolean;
  onClick?: () => void;
};

export function Logo({ href, className = "", height = 28, iconOnly = false, priority = false, onClick }: LogoProps) {
  const src = iconOnly ? ICON_SRC : LOGO_SRC;
  return (
    <Link href={href} className={`inline-flex shrink-0 items-center ${className}`} aria-label={LOGO_ALT} onClick={onClick}>
      <Image
        src={src}
        alt={LOGO_ALT}
        width={iconOnly ? 32 : 140}
        height={32}
        className={iconOnly ? "h-8 w-8 object-contain" : "h-auto w-auto max-h-10 object-contain"}
        style={iconOnly ? {} : { height: `${height}px`, width: "auto" }}
        priority={priority}
        unoptimized
      />
    </Link>
  );
}
