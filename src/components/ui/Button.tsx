import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--ring-accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-xs hover:bg-primary-hover active:bg-primary-active",
        accent: "bg-accent text-white shadow-xs hover:bg-accent-hover",
        gradient: "bg-gradient-brand text-white shadow-sm hover:brightness-110",
        outline: "border border-line-strong bg-transparent text-ink hover:bg-sunken",
        ghost: "bg-transparent text-ink hover:bg-sunken",
        subtle: "bg-brand-blue-100 text-primary hover:bg-brand-blue-100/70 dark:bg-primary/15 dark:text-primary",
        destructive: "bg-error text-white hover:brightness-95",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-[30px] px-3 text-[13px]",
        md: "h-[38px] px-4 text-sm",
        lg: "h-[46px] px-6 text-base",
        icon: "h-[38px] w-[38px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, asChild, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
