import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { getNavForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const sections = getNavForRole(user.role);

  return (
    <aside
      className={cn(
        "flex h-full w-[244px] shrink-0 flex-col bg-sidebar text-white",
        className
      )}
    >
      <div className="flex h-[60px] items-center px-5">
        <Logo onDark size={26} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, idx) => (
          <div key={section.label ?? idx} className={idx > 0 ? "mt-5" : ""}>
            {section.label && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-white/40">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                        isActive ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    <item.icon className="size-[17px] shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <p className="px-2 pb-2 text-[11px] italic text-white/40">Smarter Hiring. Better Futures.</p>
        <div className="flex items-center gap-2.5 rounded-md p-2">
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-white/50">{user.title}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-sm p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
