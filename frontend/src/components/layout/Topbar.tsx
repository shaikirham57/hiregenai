import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import * as notificationsService from "@/services/notificationsService";

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    notificationsService.getNotifications(user.role).then((items) => {
      setUnreadCount(items.filter((n) => !n.read).length);
    });
  }, [user]);

  if (!user) return null;

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <div />
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>

        <button
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-error ring-2 ring-surface" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-sunken focus-visible:outline-none">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium text-ink">{user.name}</p>
              <p className="font-normal text-muted">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
              <UserIcon className="size-4" /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} className="text-error">
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
