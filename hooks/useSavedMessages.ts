import { useState, useEffect } from "react";
import type { SavedMessage } from "@/types/app";

export const useSavedMessages = () => {
  const [saved, setSaved] = useState<SavedMessage[]>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    //Fetch saved messages from API
    setLoading(false);
  }, []);

  const deleteSaved = async (id: string) => {
    //Delete saved message via API
  };

  return { saved, deleteSaved, loading };
};
