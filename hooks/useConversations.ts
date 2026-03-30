"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConversationWithDetails } from "@/types/app";

export function useConversations(userId: string) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const supabase = createClient();

    // Single RPC that bypasses nested RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_user_conversations");

    if (error) {
      console.error("[conversations] fetch error:", error.message);
      setConversations([]);
      setLoading(false);
      return;
    }

    setConversations((data as ConversationWithDetails[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();

    const supabase = createClient();

    // Listen for new messages to refresh the list
    const channel = supabase
      .channel(`convlist:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchConversations()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_participants" },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}
