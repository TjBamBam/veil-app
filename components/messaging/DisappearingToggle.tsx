"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function DisappearingToggle({
  conversationId,
  enabled,
  onToggle,
}: {
  conversationId: string;
  enabled: boolean;
  onToggle?: (value: boolean) => void;
}) {
  const [active, setActive] = useState(enabled);

  async function toggle() {
    const next = !active;
    setActive(next);
    onToggle?.(next);

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("toggle_disappearing", {
      conv_id: conversationId,
      enabled: next,
    });
    if (error) {
      // Revert on failure
      setActive(!next);
      onToggle?.(!next);
      toast.error("Failed to update disappearing mode");
    } else {
      toast.success(next ? "Disappearing messages ON" : "Disappearing messages OFF");
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Flame className={`h-4 w-4 ${active ? "text-orange-400" : "text-muted-foreground"}`} />
      <Label htmlFor="disappearing" className="text-xs text-muted-foreground cursor-pointer hidden sm:inline">
        Disappearing
      </Label>
      <Switch
        id="disappearing"
        checked={active}
        onCheckedChange={toggle}
        className="scale-75"
      />
    </div>
  );
}
