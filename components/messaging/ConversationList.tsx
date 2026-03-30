"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCirclePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatTimestamp, truncate } from "@/lib/utils";
import { useConversations } from "@/hooks/useConversations";

export function ConversationList({ userId }: { userId: string }) {
  const pathname = usePathname();
  const { conversations, loading } = useConversations(userId);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <ConversationListHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ConversationListHeader />
      <div className="flex-1 overflow-y-auto chat-scroll">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <MessageCirclePlus className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a friend and start chatting!
            </p>
            <Link
              href="/friends"
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              Find friends →
            </Link>
          </div>
        ) : (
          conversations.map((conv) => {
            const active = pathname === `/messages/${conv.id}`;
            const name = conv.other_user?.display_name || conv.other_user?.username || "?";
            const preview = conv.last_message
              ? conv.last_message.type !== "text"
                ? `📎 ${conv.last_message.type}`
                : truncate(conv.last_message.content ?? "", 40)
              : "No messages yet";

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                  active && "bg-muted"
                )}
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTimestamp(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function ConversationListHeader() {
  return (
    <div className="px-4 py-4 border-b border-border">
      <h2 className="text-lg font-bold text-foreground">Messages</h2>
    </div>
  );
}
