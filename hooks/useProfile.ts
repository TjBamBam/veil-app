import { useState, useEffect } from "react";
import type { Profile } from "@/types/app";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    //Fetch profile
    setLoading(false);
  }, []);

  const updateProfile = async (changes: Partial<Profile>) => {
    //Update profile via API
  };

  return { profile, updateProfile, loading };
};