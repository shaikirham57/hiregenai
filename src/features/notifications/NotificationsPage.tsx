import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  Circle,
  ClipboardList,
  Cog,
  MoreVertical,
  Trash2,
  TriangleAlert,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { AiGeneratedTag } from "@/components/ai/AiGeneratedTag";
import * as notificationsService from "@/services/notificationsService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType, UserRole } from "@/types";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  status_update: BellRing,
  interview: Video,
  assessment: ClipboardList,
  system: Cog,
};

const TYPE_LABEL: Record<NotificationType, string> = {
  status_update: "APPLICATION",
  interview: "INTERVIEW",
  assessment: "ASSESSMENT",
  system: "SYSTEM",
};

const TYPE_BADGE_VARIANT: Record<NotificationType, "neutral" | "primary" | "accent"> = {
  status_update: "neutral",
  interview: "primary",
  assessment: "accent",
  system: "neutral",
};

const FLAGGED_PATTERN = /authenticity|flagged|risk/i;

function isFlagged(n: Notification) {
  return FLAGGED_PATTERN.test(`${n.title} ${n.body}`);
}

function getAction(n: Notification, role: UserRole): { label: string; to: string } | null {
  if (role === "recruiter") {
    switch (n.type) {
      case "status_update":
        return { label: isFlagged(n) ? "Review candidate" : "View candidate", to: "/candidates" };
      case "interview":
        return { label: "View interview", to: "/interviews" };
      case "assessment":
        return { label: "View results", to: "/assessments" };
      case "system":
        return null;
    }
  }
  switch (n.type) {
    case "status_update":
      return { label: "View application", to: "/my-applications" };
    case "interview":
      return { label: "View interview", to: "/my-applications" };
    case "assessment":
      return { label: "Start assessment", to: "/assessments" };
    case "system":
      return null;
  }
}

function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return formatDistanceToNow(date, { addSuffix: true });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    notificationsService.getNotifications(user.role).then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [user]);

  const markRead = async (id: string) => {
    if (!user) return;
    await notificationsService.markAsRead(user.role, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // No markAsUnread exists in the service layer — this mirrors the same in-memory state
  // markAsRead already uses, just without a backend call, since none is available to call.
  const markUnread = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await notificationsService.markAllAsRead(user.role);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const actionRequired = notifications.filter((n) => !n.read && (n.type === "interview" || n.type === "assessment" || isFlagged(n)));
  const updates = notifications.filter((n) => !n.read && !actionRequired.includes(n));
  const earlier = notifications.filter((n) => n.read);

  const renderCard = (n: Notification) => {
    const Icon = TYPE_ICON[n.type];
    const flagged = isFlagged(n);
    const action = user ? getAction(n, user.role) : null;

    return (
      <Card
        key={n.id}
        onClick={() => !n.read && markRead(n.id)}
        className={cn(
          "group cursor-pointer p-4 transition-colors",
          !n.read
            ? flagged
              ? "border-l-[3px] border-l-score-review bg-score-review-bg/40"
              : "border-l-[3px] border-l-primary bg-brand-blue-100/30 dark:bg-primary/5"
            : "bg-surface"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md",
              flagged ? "bg-score-review-bg text-score-review" : "bg-sunken text-muted"
            )}
          >
            {flagged ? <TriangleAlert className="size-4" /> : <Icon className="size-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
              <Badge variant={TYPE_BADGE_VARIANT[n.type]} className="px-1.5 py-0 text-[10px] tracking-wide">
                {TYPE_LABEL[n.type]}
              </Badge>
              {n.aiGenerated && <AiGeneratedTag className="px-2 py-0.5 text-[10px]" label="AI" />}
            </div>
            <p className={cn("mt-1 text-[13.5px] text-heading", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>

            {n.type === "interview" ? (
              <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-sunken/60 px-2.5 py-1.5 text-[12.5px] font-medium text-ink">
                <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {n.body}
              </div>
            ) : (
              <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted">{formatNotificationTime(n.createdAt)}</p>
              {action && (
                <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                  <Link to={action.to}>{action.label} →</Link>
                </Button>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 rounded-sm p-1 text-muted opacity-0 transition-opacity hover:bg-sunken hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                aria-label="Notification actions"
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!n.read ? (
                <DropdownMenuItem onSelect={() => markRead(n.id)}>
                  <CheckCheck className="size-3.5" /> Mark as read
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => markUnread(n.id)}>
                  <Circle className="size-3.5" /> Mark as unread
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => deleteNotification(n.id)} className="text-error">
                <Trash2 className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader title="Notifications" description="Stay on top of your hiring activity." />

      {loading ? (
        <Skeleton className="h-96" />
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-5" />} title="No notifications" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-4 text-[13px]">
              <span className="flex items-center gap-1.5 font-semibold text-heading">
                <span className="size-2 rounded-full bg-primary" /> {unreadCount} unread
              </span>
              <span className="text-muted">{notifications.length} total</span>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="size-4" /> Mark all as read
              </Button>
            )}
          </div>

          {actionRequired.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-eyebrow text-score-review">Action required</h2>
                <Badge variant="warning">{actionRequired.length}</Badge>
              </div>
              <div className="space-y-2.5">{actionRequired.map(renderCard)}</div>
            </div>
          )}

          {updates.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-eyebrow text-muted">Updates</h2>
                <Badge variant="neutral">{updates.length}</Badge>
              </div>
              <div className="space-y-2.5">{updates.map(renderCard)}</div>
            </div>
          )}

          {earlier.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-eyebrow text-muted">Earlier</h2>
                <Badge variant="neutral">{earlier.length}</Badge>
              </div>
              <div className="space-y-2.5">{earlier.map(renderCard)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
