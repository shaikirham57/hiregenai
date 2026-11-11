import { forwardRef, type ComponentPropsWithoutRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export const Slider = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-pill bg-sunken">
        <SliderPrimitive.Range className="absolute h-full rounded-pill bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-primary bg-surface shadow-sm transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring-accent)]" />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = "Slider";
