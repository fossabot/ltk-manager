import type { IconType } from "react-icons";
import { twMerge } from "tailwind-merge";

export type IconSize = "xs" | "sm" | "md" | "lg";

export interface IconProps {
  icon: IconType;
  size?: IconSize;
  className?: string;
}

const sizeClasses: Record<IconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function Icon({ icon: IconComponent, size = "md", className }: IconProps) {
  return <IconComponent className={twMerge(sizeClasses[size], className)} />;
}
