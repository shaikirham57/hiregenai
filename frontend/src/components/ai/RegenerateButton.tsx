import { RefreshCw } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function RegenerateButton({
  loading,
  className,
  children = "Regenerate",
  ...props
}: ButtonProps) {
  return (
    <Button variant="outline" size="sm" loading={loading} className={cn("gap-1.5", className)} {...props}>
      {!loading && <RefreshCw className="size-3.5" />}
      {children}
    </Button>
  );
}
