"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/app";

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [userId]);

  async function updateProfile(updates: Partial<Profile>) {
    if (!userId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { error };
  }

  return { profile, loading, updateProfile };
}
