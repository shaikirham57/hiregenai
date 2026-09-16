import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong px-6 py-14 text-center", className)}>
      {icon && <div className="flex size-12 items-center justify-center rounded-full bg-sunken text-muted">{icon}</div>}
      <div>
        <p className="text-sm font-semibold text-heading">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
