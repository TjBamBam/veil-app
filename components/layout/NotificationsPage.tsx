"use client";

import { useRouter } from "next/navigation";
import { Bell, Check, MessageCircle, UserPlus, UserCheck, Trash2 } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types/app";
import { cn } from "@/lib/utils";

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "new_message")
    return <MessageCircle className="h-5 w-5 text-primary" />;
  if (type === "friend_request")
    return <UserPlus className="h-5 w-5 text-green-400" />;
  return <UserCheck className="h-5 w-5 text-blue-400" />;
}

export function NotificationsPage({ userId }: { userId: string }) {
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } =
    useNotifications(userId);

  async function handleClick(n: Notification) {
    await markRead(n.id);
    if (n.type === "new_message" && n.data?.conversation_id) {
      router.push(`/messages/${n.data.conversation_id}`);
    } else if (n.type === "friend_request" || n.type === "friend_accepted") {
      router.push("/friends");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-foreground">No notifications</p>
          <p className="text-xs text-muted-foreground mt-1">
            You&apos;ll see messages and friend activity here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "w-full flex items-start gap-4 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                !n.read && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                <NotifIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !n.read ? "font-semibold text-foreground" : "text-foreground/80")}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {formatTimestamp(n.created_at)}
                </p>
              </div>
              {!n.read && (
                <div className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
