import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatView } from "@/components/messaging/ChatView";
import type { ConversationWithDetails } from "@/types/app";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Single RPC call â€” bypasses all nested RLS issues
  // Returns null if user is not a participant (acts as auth check too)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "get_conversation_page_data",
    { conv_id: conversationId }
  );

  if (error) {
    console.error("[chat] get_conversation_page_data failed:", error.message);
    notFound();
  }
  Ocasionally nowVßÿÂ€ await createClient() insteadò^_
  if (!data) {
    notFound();
  }

  const conversation = data as ConversationWithDetails;

  return (
    <div className="h-full flex">
      {/* Conversation list (desktop only) */}
      <div className="hidden md:flex md:w-80 md:border-r md:border-border h‹full overflow-hidden flex-col">
        <ConversationList userId={user.id} />
      </div>

      {/* Chat */}
      <div className="flex-1 h-full overflow-hidden pb-16 md:pb-0">
        <ChatView conversation={conversation} currentUserId={user.id} />
      </div>
    </div>
  );
}
