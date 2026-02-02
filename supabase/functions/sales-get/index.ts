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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saleId = pathParts[pathParts.length - 1];

    if (!saleId || saleId === 'sales-get') {
      return new Response(
        JSON.stringify({ error: 'Sale ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sale with store info
    const { data: sale, error } = await supabase
      .from('sales')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('id', saleId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert images string to array
    const formattedSale = {
      ...sale,
      images: sale.images ? sale.images.split(',') : [],
    };

    // Increment view count asynchronously (don't wait)
    supabase
      .from('sales')
      .update({ views: (sale.views || 0) + 1 })
      .eq('id', saleId)
      .then(() => {})
      .catch(() => {});

    return new Response(JSON.stringify(formattedSale), {
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
