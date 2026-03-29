import { useState, useEffect } from "react";
import type { Conversation } from "@/types/app";

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => { //Fetch conversations from API }, []);

  const deleteConversation = async (id: string) => { //Delete via API };

  return { conversations, deleteConversation, deleting };
};
