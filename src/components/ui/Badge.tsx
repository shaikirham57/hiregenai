import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-medium leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-sunken text-ink",
        primary: "bg-brand-blue-100 text-primary dark:bg-primary/15",
        accent: "bg-brand-violet-100 text-accent dark:bg-accent/15",
        success: "bg-score-strong-bg text-score-strong",
        warning: "bg-score-review-bg text-score-review",
        error: "bg-score-weak-bg text-score-weak",
        outline: "border border-line-strong text-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
