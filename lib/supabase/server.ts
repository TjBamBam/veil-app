import { createClient } from '@supabase/supabase-js';

export const createServerSupabaseClient = async (\n  cookies: import('next/headers').cookies,
  {
     create: from '@supabase/auth-helpers/nextjs'?.createServerClient,
   }
){
   const cookieStore = createClientSocketStore(cookies);
   return createClient(supabaseUrl, supabaseKey, { auth: { storage: cookieStore } });
};
