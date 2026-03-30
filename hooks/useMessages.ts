"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithMedia } from "@/types/app";

const PAGE_SIZE = 40;

export function useMessages(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchMessages = useCallback(async (before?: string) => {
    const supabase = createClient();
    let query = supabase
      .from("messages")
      .select("*, media:message_media(*), sender:profiles!sender_id(*)")
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (before) query = query.lt("created_at", before);

    const { data } = await query;
    const msgs = (data ?? []).reverse() as MessageWithMedia[];
    // Track seen message IDs
    msgs.forEach((m) => seenIdsRef.current.add(m.id));
    return msgs;
  }, [conversationId]);

  // Add a message to state, deduplicating
  const addMessage = useCallback((msg: MessageWithMedia) => {
    if (seenIdsRef.current.has(msg.id)) return;
    seenIdsRef.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    // Reset state when conversation changes
    seenIdsRef.current = new Set();
    setMessages([]);
    setLoading(true);

    fetchMessages().then((msgs) => {
      setMessages(msgs);
      setHasMore(msgs.length === PAGE_SIZE);
      setLoading(false);
    });

    const supabase = createClient();

    // Channel with both postgres_changes AND broadcast
    const channel = supabase
      .channel(`conv:${conversationId}`, {
        config: { broadcast: { self: false } },
      })
      // Listen for DB changes (requires Realtime enabled on messages table)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newRow = payload.new as { id: string; type?: string };
          const newId = newRow.id;
          if (seenIdsRef.current.has(newId)) return;

          // Fetch full message with joins
          const fetchFull = async () => {
            const { data } = await supabase
              .from("messages")
              .select("*, media:message_media(*), sender:profiles!sender_id(*)")
              .eq("id", newId)
              .single();
            return data as MessageWithMedia | null;
          };

          let msg = await fetchFull();
          if (!msg) return;

          // For image/video messages, media may not be attached yet — retry once after a short delay
          const isMediaType = newRow.type === "image" || newRow.type === "video";
          if (isMediaType && (!msg.media || Object.keys(msg.media).length === 0)) {
            await new Promise((r) => setTimeout(r, 1500));
            const retry = await fetchFull();
            if (retry) msg = retry;
          }

          addMessage(msg);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...payload.new } : m
            )
          );
        }
      )
      // Also listen for broadcast messages (immediate, no RLS dependency)
      .on("broadcast", { event: "new_message" }, async (payload) => {
        const msgId = payload.payload?.id as string;
        const msgType = payload.payload?.type as string | undefined;
        if (!msgId || seenIdsRef.current.has(msgId)) return;

        const fetchFull = async () => {
          const { data } = await supabase
            .from("messages")
            .select("*, media:message_media(*), sender:profiles!sender_id(*)")
            .eq("id", msgId)
            .single();
          return data as MessageWithMedia | null;
        };

        let msg = await fetchFull();
        if (!msg) return;

        // For image/video messages, media may not be attached yet — retry once
        const isMediaType = msgType === "image" || msgType === "video" || msg.type === "image" || msg.type === "video";
        if (isMediaType && (!msg.media || Object.keys(msg.media).length === 0)) {
          await new Promise((r) => setTimeout(r, 1500));
          const retry = await fetchFull();
          if (retry) msg = retry;
        }

        addMessage(msg);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[realtime] subscribed to conv:", conversationId);
        }
        if (status === "CHANNEL_ERROR") {
          console.error("[realtime] channel error for conv:", conversationId);
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages, addMessage]);

  async function loadMore() {
    if (!messages.length) return;
    const oldest = messages[0].created_at;
    const older = await fetchMessages(oldest);
    setMessages((prev) => [...older, ...prev]);
    setHasMore(older.length === PAGE_SIZE);
  }

  async function markOpened(messageId: string) {
    const supabase = createClient();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.sender_id === currentUserId || msg.opened_at) return;

    await supabase
      .from("messages")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", messageId);
  }

  async function sendMessage(content: string, type: "text" | "image" | "video" = "text") {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        type,
      })
      .select("*, media:message_media(*), sender:profiles!sender_id(*)")
      .single();

    if (data) {
      // Add to local state immediately for the sender
      addMessage(data as MessageWithMedia);

      // Also broadcast to the channel so the other user gets it instantly
      channelRef.current?.send({
        type: "broadcast",
        event: "new_message",
        payload: { id: (data as { id: string }).id, type },
      });
    }

    return { data: data as unknown as { id: string } | null, error };
  }

  async function saveMessage(messageId: string, save: boolean) {
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({ is_saved: save })
      .eq("id", messageId);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_saved: save } : m))
    );
  }

  async function deleteMessage(messageId: string) {
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId)
      .eq("sender_id", currentUserId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  async function refreshMessage(messageId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*, media:message_media(*), sender:profiles!sender_id(*)")
      .eq("id", messageId)
      .single();
    if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? (data as MessageWithMedia) : m))
      );
    }
  }

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    markOpened,
    sendMessage,
    saveMessage,
    deleteMessage,
    refreshMessage,
  };
}
