"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronRight, MessageCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatMessageTime, formatTimestamp, cn } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import { useSavedMessages, type SavedGroup } from "@/hooks/useSavedMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function SavedMessages({ userId }: { userId: string }) {
  const router = useRouter();
  const { groups, loading, unsave } = useSavedMessages(userId);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleUnsave(id: string) {
    await unsave(id);
    toast.success("Message unsaved");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Snapchat-style: show user list, tap to expand saved messages
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Saved Chats</h1>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground">No saved messages</p>
          <p className="text-xs text-muted-foreground mt-1">
            Long-press or hover over a message and tap the bookmark to save it
          </p>
        </div>
      ) : expanded ? (
        // Expanded view: show saved messages for one user
        <ExpandedView
          group={groups.find((g) => g.conversation_id === expanded)!}
          userId={userId}
          onBack={() => setExpanded(null)}
          onUnsave={handleUnsave}
          onOpenChat={(convId) => router.push(`/messages/${convId}`)}
        />
      ) : (
        // User list: Snapchat-style cards
        <div className="space-y-2">
          {groups.map((group) => {
            const user = group.other_user;
            const name = user.display_name || user.username;
            const count = group.messages.length;
            const latest = group.messages[0];

            return (
              <button
                key={group.conversation_id}
                onClick={() => setExpanded(group.conversation_id)}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTimestamp(latest.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count} saved message{count > 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExpandedView({
  group,
  userId,
  onBack,
  onUnsave,
  onOpenChat,
}: {
  group: SavedGroup;
  userId: string;
  onBack: () => void;
  onUnsave: (id: string) => void;
  onOpenChat: (convId: string) => void;
}) {
  const user = group.other_user;
  const name = user.display_name || user.username;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenChat(group.conversation_id)}
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
          Open Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {group.messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-2",
                isMine ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  isMine ? "bubble-mine rounded-br-md" : "bubble-theirs rounded-bl-md"
                )}
              >
                {msg.type !== "text" && (
                  <p className="text-xs opacity-70 mb-1">
                    {msg.type === "image" ? "📷 Photo" : "🎥 Video"}
                  </p>
                )}
                {msg.content && <p>{sanitize(msg.content)}</p>}
              </div>
              <div className="flex flex-col items-center gap-1 mt-1">
                <button
                  onClick={() => onUnsave(msg.id)}
                  className="rounded-full p-1 hover:bg-muted transition-colors"
                  title="Unsave"
                >
                  <Bookmark className="h-3 w-3 text-primary fill-current" />
                </button>
                <span className="text-[10px] text-muted-foreground">
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
