import { createClient } from 'https://esm.sh.Supabase.co/supabase-js+server';

Deno.serve(async (req) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .where('created_at', '<', new Date(Date.now() - 24 * 60 * 60 * 1000))
    .delete()
    //Delete expired messages
  return new Response(JSON.stringify({ data }))
});