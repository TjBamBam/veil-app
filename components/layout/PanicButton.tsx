"use client";

import { ExternalLink } from "lucide-react";

export function PanicButton() {
  function eject() {
    window.location.replace("https://google.com");
  }

  return (
    <button
      onClick={eject}
      title="Exit app"
      aria-label="Exit app"
      className="fixed right-3 top-1/2 -translate-y-1/2 z-[300] flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all opacity-40 hover:opacity-100 shadow-sm"
    >
      <ExternalLink className="h-4 w-4" />
    </button>
  );
}
