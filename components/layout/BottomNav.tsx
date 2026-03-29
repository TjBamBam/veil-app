"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageCircle, Users, Bookmark, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

const NAV_ITEMS = [
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav({ userId }: { userId: string }) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications(userId);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border">
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
              {label}
            </Link>
          );
        })}

        {/* Notification tab on mobile */}
        <Link
          href="/notifications"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative",
            pathname === "/notifications"
              ? "text-primary"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
          )}
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          Alerts
        </Link>
      </div>
    </nav>
  );
}
