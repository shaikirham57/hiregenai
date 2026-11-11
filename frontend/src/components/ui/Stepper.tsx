import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
}

export function Stepper({ steps, currentStep }: { steps: StepperStep[]; currentStep: number }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const complete = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={step.label} className="flex min-w-[100px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1", i === 0 ? "invisible" : complete ? "bg-primary" : "bg-line")} />
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                  complete ? "bg-primary text-white" : active ? "bg-accent text-white" : "bg-sunken text-muted"
                )}
              >
                {complete ? <Check className="size-3.5" /> : i + 1}
              </div>
              <div className={cn("h-0.5 flex-1", i === steps.length - 1 ? "invisible" : complete ? "bg-primary" : "bg-line")} />
            </div>
            <p className={cn("mt-2 text-[11.5px] font-medium leading-tight", complete || active ? "text-heading" : "text-muted")}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}
