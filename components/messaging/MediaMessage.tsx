"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";
import type { MessageMedia } from "@/types/app";

export function MediaMessage({ media }: { media: MessageMedia }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getSignedUrl("message-media", media.storage_path).then(setUrl);
  }, [media.storage_path]);

  if (!url) {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl bg-black/20">
        <Loader2 className="h-5 w-5 animate-spin text-white/60" />
      </div>
    );
  }

  if (media.mime_type.startsWith("video/")) {
    return (
      <video
        src={url}
        controls
        className="max-w-[280px] rounded-xl"
        style={{ maxHeight: 300 }}
        preload="metadata"
      />
    );
  }

  return (
    <div className="relative max-w-[280px] overflow-hidden rounded-xl">
      <Image
        src={url}
        alt="Shared image"
        width={media.width ?? 280}
        height={media.height ?? 200}
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
