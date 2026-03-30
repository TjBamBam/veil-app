"use client";

import { useRef, useEffect, useState } from "react";
import { Flame, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { formatMessageTime } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import { MediaMessage } from "./MediaMessage";
import type { MessageWithMedia } from "@/types/app";
import { cn } from "@/lib/utils";

interface Props {
  message: MessageWithMedia;
  isMine: boolean;
  disappearingEnabled: boolean;
  onMarkOpened: (id: string) => void;
  onSave: (id: string, save: boolean) => void;
  onDelete: (id: string) => void;
}

export function MessageBubble({
  message,
  isMine,
  disappearingEnabled,
  onMarkOpened,
  onSave,
  onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  // IntersectionObserver: mark as opened when recipient views it
  useEffect(() => {
    if (isMine || message.opened_at) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onMarkOpened(message.id);
          observer.disconnect();

          // If disappearing is on and not saved, fade out after 3 seconds
          if (disappearingEnabled && !message.is_saved) {
            setTimeout(() => setFading(true), 3000);
            setTimeout(() => setHidden(true), 4000);
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMine, message.id, message.opened_at, onMarkOpened, disappearingEnabled, message.is_saved]);

  // For sender: when they see "Seen" and disappearing is on, fade out too
  useEffect(() => {
    if (!isMine || !message.opened_at || !disappearingEnabled || message.is_saved) return;
    const t1 = setTimeout(() => setFading(true), 3000);
    const t2 = setTimeout(() => setHidden(true), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isMine, message.opened_at, disappearingEnabled, message.is_saved]);

  if (hidden) return null;

  const isDisappearing = disappearingEnabled && !message.is_saved;
  const wasOpened = !!message.opened_at;

  return (
    <div
      ref={ref}
      className={cn(
        "group flex items-end gap-2 px-4 transition-opacity duration-1000",
        isMine ? "flex-row-reverse" : "flex-row",
        fading && "opacity-0"
      )}
    >
      <div className={cn("max-w-[75%] flex flex-col gap-1", isMine && "items-end")}>
        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
            isMine ? "bubble-mine rounded-br-md" : "bubble-theirs rounded-bl-md"
          )}
        >
          {/* Media */}
          {message.media && (
            <div className={message.content ? "mb-2" : ""}>
              <MediaMessage media={message.media} />
            </div>
          )}

          {/* Text */}
          {message.content && (
            <p>{sanitize(message.content)}</p>
          )}

          {/* Disappearing indicator */}
          {isDisappearing && !wasOpened && !isMine && (
            <Flame className="absolute -top-2 -right-2 h-4 w-4 text-orange-400" />
          )}
          {isDisappearing && wasOpened && (
            <Flame className="absolute -top-2 -right-2 h-4 w-4 text-orange-400 animate-pulse" />
          )}
        </div>

        {/* Footer: time + status */}
        <div className={cn("flex items-center gap-2 px-1", isMine && "flex-row-reverse")}>
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.created_at)}
          </span>
          {isMine && wasOpened && (
            <span className="text-xs text-primary">Seen</span>
          )}
          {message.is_saved && (
            <BookmarkCheck className="h-3 w-3 text-primary" />
          )}
        </div>
      </div>

      {/* Context actions on hover */}
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-6",
          isMine ? "flex-row-reverse" : "flex-row"
        )}
      >
        <button
          onClick={() => onSave(message.id, !message.is_saved)}
          className="rounded-full p-1 hover:bg-muted transition-colors"
          title={message.is_saved ? "Unsave" : "Save message"}
        >
          {message.is_saved ? (
            <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        {isMine && (
          <button
            onClick={() => onDelete(message.id)}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            title="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}
