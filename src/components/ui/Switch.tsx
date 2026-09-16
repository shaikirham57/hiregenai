import { forwardRef, type ComponentPropsWithoutRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-[22px] w-[38px] shrink-0 rounded-pill bg-line-strong transition-colors data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:shadow-[var(--ring-accent)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[18px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-[var(--duration-fast)] data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  )
);
Switch.displayName = "Switch";
