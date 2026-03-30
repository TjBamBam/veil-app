import { createClient } from "@/lib/supabase/client";

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string; publicUrl?: string } | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  if (bucket === "avatars") {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    return { path: data.path, publicUrl: urlData.publicUrl };
  }

  return { path: data.path };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, paths: string[]) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) console.error("Delete error:", error.message);
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
