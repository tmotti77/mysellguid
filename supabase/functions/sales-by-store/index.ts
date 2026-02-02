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
    const storeId = pathParts[pathParts.length - 1];
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!storeId || storeId === 'sales-by-store') {
      return new Response(
        JSON.stringify({ error: 'Store ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sales for store
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('storeId', storeId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert images string to array for each sale
    const formattedSales = (sales || []).map((sale: any) => ({
      ...sale,
      images: sale.images ? sale.images.split(',') : [],
    }));

    return new Response(JSON.stringify(formattedSales), {
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
