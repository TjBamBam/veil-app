"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { DisappearingToggle } from "./DisappearingToggle";
import { useMessages } from "@/hooks/useMessages";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import type { ConversationWithDetails } from "@/types/app";
import { Button } from "@/components/ui/button";

interface Props {
  conversation: ConversationWithDetails;
  currentUserId: string;
}

export function ChatView({ conversation, currentUserId }: Props) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [disappearing, setDisappearing] = useState(conversation.disappearing_enabled);
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    markOpened,
    sendMessage,
    saveMessage,
    deleteMessage,
    refreshMessage,
  } = useMessages(conversation.id, currentUserId);
  const { uploading, uploadMedia, attachMedia } = useMediaUpload();

  useEffect(() => {
    setDisappearing(conversation.disappearing_enabled);
  }, [conversation.disappearing_enabled]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  // Disappearing: when a message is marked opened and disappearing is on,
  // fade it out client-side after a short delay
  const handleMarkOpened = useCallback(
    async (id: string) => {
      await markOpened(id);
    },
    [markOpened]
  );

  async function handleSendText(content: string) {
    await sendMessage(content, "text");
  }

  async function handleSendMedia(file: File) {
    const isVideo = file.type.startsWith("video/");
    const type = isVideo ? "video" : "image";

    const { data: msg } = await sendMessage("", type);
    if (!msg?.id) return;

    const uploaded = await uploadMedia(file, conversation.id);
    if (!uploaded) return;

    await attachMedia(msg.id, uploaded.path, uploaded.mimeType, uploaded.fileSize);
    await refreshMessage(msg.id);
  }

  const otherUser = conversation.other_user;
  const displayName = otherUser.display_name || otherUser.username;

  return (
    <div className="flex flex-col h-full">
      {/* Header — no z-index, sits in normal flow */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 rounded-full"
          onClick={() => router.push("/messages")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={otherUser.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{otherUser.username}</p>
          </div>
        </div>

        <DisappearingToggle
          conversationId={conversation.id}
          enabled={disappearing}
          onToggle={setDisappearing}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll py-4 space-y-3">
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={loadMore}
              className="text-xs text-primary hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarImage src={otherUser.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Say hi to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === currentUserId}
              disappearingEnabled={disappearing}
              onMarkOpened={handleMarkOpened}
              onSave={saveMessage}
              onDelete={deleteMessage}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSendText}
        onSendMedia={handleSendMedia}
        uploading={uploading}
      />
    </div>
  );
}
