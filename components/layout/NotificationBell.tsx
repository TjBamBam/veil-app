"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, Check, MessageCircle, UserPlus, UserCheck, Trash2 } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types/app";
import { cn } from "@/lib/utils";

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } =
    useNotifications(userId);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleClick(n: Notification) {
    await markRead(n.id);
    setOpen(false);
    if (n.type === "new_message" && n.data?.conversation_id) {
      router.push(`/messages/${n.data.conversation_id}`);
    } else if (n.type === "friend_request" || n.type === "friend_accepted") {
      router.push("/friends");
    }
  }

  function NotifIcon({ type }: { type: Notification["type"] }) {
    if (type === "new_message")
      return <MessageCircle className="h-4 w-4 text-primary" />;
    if (type === "friend_request")
      return <UserPlus className="h-4 w-4 text-green-400" />;
    return <UserCheck className="h-4 w-4 text-blue-400" />;
  }

  // Get button position for panel placement
  const rect = buttonRef.current?.getBoundingClientRect();
  const panelLeft = rect ? rect.right + 8 : 272;
  const panelTop = rect ? rect.top : 16;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200]"
            onClick={() => setOpen(false)}
          />

          {/* Panel — rendered at body level, escapes sidebar stacking context */}
          <div
            className="fixed z-[201] w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
            style={{ left: panelLeft, top: panelTop }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-muted transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="rounded-lg p-1 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", !n.read ? "font-semibold text-foreground" : "text-foreground/80")}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                      )}
                      <p className="text.xs text-muted-foreground/60 mt-0.5">
                        {formatTimestamp(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
