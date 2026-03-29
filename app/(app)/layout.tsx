import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PanicButton } from "@/components/layout/PanicButton";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import type { Profile, Theme } from "@/types/app";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <ThemeProvider theme={profile.theme as Theme}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar profile={profile} />
        <main className="flex-1 overflow-hidden relative z-0">{children}</main>
        <BottomNav userId={profile.id} />
        <PanicButton />
      </div>
    </ThemeProvider>
  );
}
