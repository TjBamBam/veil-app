import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/messaging/ConversationList";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="h-full flex">
      {/* Left panel: conversation list (full width on mobile, fixed on desktop) */}
      <div className="w-full md:w-80 md:border-r md:border-border h-full overflow-hidden">
        <ConversationList userId={user.id} />
      </div>

      {/* Right panel: chat (hidden on mobile until a conv is selected) */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-sm font-medium text-foreground">Select a conversation</p>
          <p className="text-xs text-muted-foreground mt-1">
            Choose from the left or start a new chat
          </p>
        </div>
      </div>
    </div>
  );
}
