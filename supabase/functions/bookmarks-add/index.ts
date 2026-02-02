import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saleId = pathParts[pathParts.length - 1];

    if (!saleId || saleId === 'bookmarks-add') {
      return new Response(
        JSON.stringify({ error: 'Sale ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if bookmark already exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('userId', user.id)
      .eq('saleId', saleId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Already bookmarked', bookmark: existing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create bookmark
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        userId: user.id,
        saleId: saleId,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment saves count on sale
    supabase
      .from('sales')
      .update({ saves: await getSaveCount(supabase, saleId) })
      .eq('id', saleId)
      .then(() => {})
      .catch(() => {});

    return new Response(JSON.stringify(bookmark), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getSaveCount(supabase: any, saleId: string): Promise<number> {
  const { data } = await supabase
    .from('sales')
    .select('saves')
    .eq('id', saleId)
    .single();
  return (data?.saves || 0) + 1;
}
