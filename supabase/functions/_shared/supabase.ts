import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create client with user JWT for RLS
export function createUserClient(authHeader?: string) {
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  return createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}
