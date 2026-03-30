"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ThemePicker } from "@/components/theme/ThemePicker";
import type { Profile, Theme } from "@/types/app";

const profileSchema = z.object({
  display_name: z.string().min(1).max(50),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  bio: z.string().max(200).optional(),
});

export function SettingsPanel({
  profile,
  currentTheme,
}: {
  profile: Profile;
  currentTheme: Theme;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    username: profile.username,
    bio: profile.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const path = `${profile.id}/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    const result = await uploadFile("avatars", path, file);

    if (!result?.publicUrl) {
      toast.error("Failed to upload avatar");
      setUploadingAvatar(false);
      return;
    }

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ avatar_url: result.publicUrl })
      .eq("id", profile.id);

    setAvatarUrl(result.publicUrl);
    toast.success("Avatar updated!");
    setUploadingAvatar(false);
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name,
        username: form.username.toLowerCase(),
        bio: form.bio || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message.includes("unique") ? "Username already taken" : error.message);
    } else {
      toast.success("Profile saved!");
      router.refresh();
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = form.display_name || form.username;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {uploadingAvatar ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground">@{form.username}</p>
        </div>
      </div>

      <Separator />

      {/* Profile form */}
      <form onSubmit={handleSave} className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Profile</h2>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              @
            </span>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => update("username", e.target.value.toLowerCase())}
              className="pl-8"
              maxLength={30}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Tell people a bit about yourself…"
            maxLength={200}
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">{form.bio.length}/200</p>
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Save changes</>
          )}
        </Button>
      </form>

      <Separator />

      {/* Theme */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        <ThemePicker currentTheme={currentTheme} />
      </div>

      <Separator />

      {/* Account */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="w-full sm:w-auto"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
