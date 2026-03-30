import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SavedMessages } from "@/components/saved/SavedMessages";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="h-full overflow-y-auto pb-16 md:pb-0">
      <SavedMessages userId={user.id} />
    </div>
  );
}
