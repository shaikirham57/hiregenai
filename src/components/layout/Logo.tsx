import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="hg-mark-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#03123D" />
          <stop offset="52%" stopColor="#0053FE" />
          <stop offset="100%" stopColor="#6E1EEE" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#hg-mark-gradient)" />
      <path d="M9 8v16M23 8v16M9 16h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="23.5" cy="8.5" r="2" fill="#B69FF0" />
    </svg>
  );
}

export function Logo({
  onDark = false,
  showWordmark = true,
  size = 30,
  className,
}: {
  onDark?: boolean;
  showWordmark?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display text-[19px] font-bold tracking-tight">
          <span className={onDark ? "text-white" : "text-brand-navy-900"}>Hire</span>
          <span className={onDark ? "text-white" : "text-brand-navy-900"}>Gen</span>{" "}
          <span className="text-gradient-brand">Ai</span>
        </span>
      )}
    </div>
  );
}
