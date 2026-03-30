"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (content: string) => Promise<void>;
  onSendMedia?: (file: File) => Promise<void>;
  uploading?: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, onSendMedia, uploading, disabled }: Props) {
  const [text, setText] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return;

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearFile() {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSend() {
    if (sending || disabled) return;
    setSending(true);

    if (previewFile && onSendMedia) {
      await onSendMedia(previewFile);
      clearFile();
    } else if (text.trim()) {
      await onSend(text.trim());
      setText("");
    }

    setSending(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      {/* File preview */}
      {previewUrl && (
        <div className="mb-2 relative inline-block">
          {previewFile?.type.startsWith("video/") ? (
            <video
              src={previewUrl}
              className="max-h-32 rounded-lg"
              controls={false}
              muted
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="preview"
              className="max-h-32 rounded-lg object-cover"
            />
          )}
          <button
            onClick={clearFile}
            className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={previewFile ? "Add a caption… (optional)" : "Message…"}
          className={cn(
            "min-h-0 max-h-32 resize-none rounded-2xl border-border bg-secondary py-2.5 text-sm",
            "focus-visible:ring-primary"
          )}
          rows={1}
          disabled={disabled}
        />

        <Button
          size="icon"
          onClick={handleSend}
          disabled={(!text.trim() && !previewFile) || sending || uploading || disabled}
          className="h-9 w-9 shrink-0 rounded-full"
        >
          {sending || uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
