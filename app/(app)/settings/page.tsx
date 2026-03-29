import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsPanel } from "@/components/profile/SettingsPanel";
import type { Profile, Theme } from "@/types/app";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profileData) redirect("/login");

  const profile = profileData as unknown as Profile;

  return (
    <div className="h-full overflow-y-auto pb-16 md:pb-0">
      <SettingsPanel profile={profile} currentTheme={profile.theme as Theme} />
    </div>
  );
}
