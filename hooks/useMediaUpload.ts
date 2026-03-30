"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateStoragePath } from "@/lib/utils";

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);

  async function uploadMedia(
    file: File,
    conversationId: string
  ): Promise<{ path: string; mimeType: string; fileSize: number } | null> {
    setUploading(true);

    const path = generateStoragePath(conversationId, file.name);
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from("message-media")
      .upload(path, file, { upsert: false });

    setUploading(false);

    if (error) {
      console.error("Media upload error:", error.message);
      return null;
    }

    return { path: data.path, mimeType: file.type, fileSize: file.size };
  }

  async function attachMedia(
    messageId: string,
    path: string,
    mimeType: string,
    fileSize: number
  ) {
    const supabase = createClient();
    await supabase.from("message_media").insert({
      message_id: messageId,
      storage_path: path,
      mime_type: mimeType,
      file_size: fileSize,
    });
  }

  return { uploading, uploadMedia, attachMedia };
}
