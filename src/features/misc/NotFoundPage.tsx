import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-sunken text-muted">
        <Compass className="size-6" />
      </div>
      <div>
        <h1 className="font-display text-h1 font-bold text-heading">Page not found</h1>
        <p className="mt-2 text-body-md text-muted">The page you're looking for doesn't exist or has moved.</p>
      </div>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
