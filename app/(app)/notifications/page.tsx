import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsPage } from "@/components/layout/NotificationsPage";

export default async function NotificationsRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-0">
      <NotificationsPage userId={user.id} />
    </div>
  );
}
