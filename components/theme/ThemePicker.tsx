"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { THEMES, type Theme } from "@/types/app";

export function ThemePicker({ currentTheme }: { currentTheme: Theme }) {
  const [selected, setSelected] = useState<Theme>(currentTheme);
  const [saving, setSaving] = useState(false);

  async function applyTheme(theme: Theme) {
    setSelected(theme);
    document.documentElement.setAttribute("data-theme", theme);

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ theme })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (error) {
      toast.error("Failed to save theme");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Theme</p>
        {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {THEMES.map((t) => (
          <button
            key={t.value}
            onClick={() => applyTheme(t.value)}
            className="group relative flex flex-col items-center gap-1.5"
          >
            <div
              className="h-10 w-10 rounded-full border-2 transition-all"
              style={{
                background: t.preview,
                borderColor: selected === t.value ? "var(--primary)" : "var(--border)",
                boxShadow: selected === t.value ? "0 0 0 2px var(--primary)" : "none",
              }}
            >
              {selected === t.value && (
                <Check
                  className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                  strokeWidth={3}
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
