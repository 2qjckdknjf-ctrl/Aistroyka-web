"use client";

import type { LucideIcon } from "lucide-react";

type IconProps = {
  icon: LucideIcon;
  size?: number;
  className?: string;
};

export function Icon({ icon: LucideIcon, size = 20, className = "" }: IconProps) {
  return <LucideIcon size={size} className={className} />;
}
