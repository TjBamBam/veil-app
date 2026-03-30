"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type SavedMessage = {
  id: string;
  content: string | null;
  type: "text" | "image" | "video";
  created_at: string;
  sender_id: string;
  is_saved: boolean;
};

export type SavedGroup = {
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  conversation_id: string;
  messages: SavedMessage[];
};

export function useSavedMessages(userId: string) {
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_saved_messages_by_user");

    if (error) {
      console.error("[saved] fetch error:", error.message);
      setGroups([]);
      setLoading(false);
      return;
    }

    setGroups((data as SavedGroup[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function unsave(messageId: string) {
    const supabase = createClient();
    await supabase.from("messages").update({ is_saved: false }).eq("id", messageId);
    // Remove from local state
    setGroups((prev) =>
      prev
        .map((g) => ({
          ...g,
          messages: g.messages.filter((m) => m.id !== messageId),
        }))
        .filter((g) => g.messages.length > 0)
    );
  }

  return { groups, loading, unsave, refetch: fetch };
}
