import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiGeneratedTag({ label = "AI generated — review", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-gradient-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-navy-900 dark:bg-none dark:bg-accent/10 dark:text-brand-lilac-400",
        className
      )}
    >
      <Sparkles className="size-3" />
      {label}
    </span>
  );
}
