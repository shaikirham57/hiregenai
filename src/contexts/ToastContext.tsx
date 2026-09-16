import { createContext, useCallback, useState, type ReactNode } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "warning" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastOptions {
  id: number;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: TriangleAlert,
};

const ICON_COLOR: Record<ToastVariant, string> = {
  default: "text-primary",
  success: "text-score-strong",
  warning: "text-score-review",
  error: "text-score-weak",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {toasts.map(({ id, title, description, variant = "default" }) => {
          const Icon = ICONS[variant];
          return (
            <ToastPrimitive.Root
              key={id}
              onOpenChange={(open) => !open && dismiss(id)}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-right-full"
              )}
            >
              <Icon className={cn("mt-0.5 size-[18px] shrink-0", ICON_COLOR[variant])} />
              <div className="flex-1">
                <ToastPrimitive.Title className="text-[13px] font-semibold text-heading">{title}</ToastPrimitive.Title>
                {description && (
                  <ToastPrimitive.Description className="mt-0.5 text-[13px] text-muted">
                    {description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className="text-muted hover:text-ink">
                <X className="size-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="pointer-events-none fixed bottom-0 right-0 z-[100] m-0 flex w-full max-w-sm list-none flex-col gap-2 p-6 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
