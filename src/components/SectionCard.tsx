import { type ReactElement, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface SectionCardProps {
  title: string;
  icon?: ReactElement;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className }: SectionCardProps) {
  return (
    <section
      className={twMerge(
        "rounded-xl border border-surface-700/50 bg-surface-900/80 p-5",
        className,
      )}
    >
      <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-surface-100">
        {icon && <span className="text-surface-400">{icon}</span>}
        {title}
      </h3>
      {children}
    </section>
  );
}
