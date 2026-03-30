"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FriendshipWithProfile, Profile } from "@/types/app";

export function useFriends(userId: string) {
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendshipWithProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("friendships")
      .select("*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (!data) return;

    const withProfile = data.map((f) => ({
      ...f,
      profile: (f.requester_id === userId ? f.addressee : f.requester) as Profile,
    })) as FriendshipWithProfile[];

    setFriends(withProfile.filter((f) => f.status === "accepted"));
    setIncoming(
      withProfile.filter((f) => f.status === "pending" && f.addressee_id === userId)
    );
    setOutgoing(
      withProfile.filter((f) => f.status === "pending" && f.requester_id === userId)
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
    const supabase = createClient();
    const channel = supabase
      .channel("friendships-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        fetch
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  async function sendRequest(addresseeId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: userId, addressee_id: addresseeId });
    return { error };
  }

  async function respondToRequest(friendshipId: string, accept: boolean) {
    const supabase = createClient();
    if (accept) {
      await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);
    } else {
      await supabase.from("friendships").delete().eq("id", friendshipId);
    }
    await fetch();
  }

  async function unfriend(friendshipId: string) {
    const supabase = createClient();
    await supabase.from("friendships").delete().eq("id", friendshipId);
    await fetch();
  }

  async function searchUsers(query: string): Promise<Profile[]> {
    if (!query.trim()) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${query}%`)
      .neq("id", userId)
      .limit(20);
    return data ?? [];
  }

  return {
    friends,
    incoming,
    outgoing,
    loading,
    sendRequest,
    respondToRequest,
    unfriend,
    searchUsers,
    refetch: fetch,
  };
}
