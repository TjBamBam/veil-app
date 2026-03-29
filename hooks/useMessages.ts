import { useState, useEffect } from "react";
import type { Message } from "@/types/app";

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    //Fetch messages for conversation
  }, [conversationId]);

  const sendMessage = async (content: string, file?: File) => {
    //Send message via API
  };

  const deleteMessage = async (id: string) => {
    //Delete message via API
  };

  return { messages, sendMessage, deleteMessage, loading };
};
