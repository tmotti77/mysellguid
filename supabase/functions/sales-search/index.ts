import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').trim();
    const category = url.searchParams.get('category');
    const minDiscount = url.searchParams.get('minDiscount');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query param "q" must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();

    // Build filter: active sales within date range
    let builder = supabase
      .from('sales')
      .select('*, store:stores(id, name, category, logo, address, city)')
      .eq('status', 'active')
      .lte('startDate', now)
      .gte('endDate', now)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (category) builder = builder.eq('category', category);
    if (minDiscount) builder = builder.gte('discountPercentage', parseInt(minDiscount));

    const { data, error } = await builder
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formatted = (data || []).map((sale: any) => ({
      ...sale,
      images: sale.images ? sale.images.split(',') : [],
    }));

    return new Response(JSON.stringify(formatted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
