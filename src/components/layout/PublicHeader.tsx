import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";

export function PublicHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-6">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="md" asChild className="mr-1 hidden sm:inline-flex">
            <Link to="/find-jobs">Browse jobs</Link>
          </Button>
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <Button variant="ghost" size="md" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button variant="primary" size="md" asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
