import { type ReactElement, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactElement;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={twMerge(
        "rounded-xl border border-surface-700/50 bg-surface-900/95 p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-surface-200">
            {icon && <span className="text-surface-400">{icon}</span>}
            {title}
          </h3>
          {description && <p className="mt-0.5 text-xs text-surface-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
