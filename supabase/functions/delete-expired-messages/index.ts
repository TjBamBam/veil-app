import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (_req) => {
  try {
    // Find conversations with disappearing enabled
    const { data: disappearingConvs } = await supabase
      .from("conversations")
      .select("id")
      .eq("disappearing_enabled", true);

    if (!disappearingConvs?.length) {
      return new Response(JSON.stringify({ deleted: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const convIds = disappearingConvs.map((c: { id: string }) => c.id);

    // Find messages to delete: opened, not saved, in disappearing convs
    const { data: toDelete } = await supabase
      .from("messages")
      .select("id, message_media(storage_path)")
      .in("conversation_id", convIds)
      .eq("is_deleted", false)
      .eq("is_saved", false)
      .not("opened_at", "is", null);

    if (!toDelete?.length) {
      return new Response(JSON.stringify({ deleted: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const ids = toDelete.map((m: { id: string }) => m.id);

    // Soft-delete messages
    const { error: deleteError } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .in("id", ids);

    if (deleteError) throw deleteError;

    // Remove storage objects for media messages
    const mediaPaths = toDelete
      .flatMap((m: { message_media?: { storage_path: string } | null }) =>
        m.message_media?.storage_path ? [m.message_media.storage_path] : []
      )
      .filter(Boolean);

    if (mediaPaths.length > 0) {
      await supabase.storage.from("message-media").remove(mediaPaths);
    }

    return new Response(
      JSON.stringify({ deleted: ids.length, mediaCleaned: mediaPaths.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
