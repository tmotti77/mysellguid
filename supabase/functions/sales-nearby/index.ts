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
    const latitude = parseFloat(url.searchParams.get('lat') || '0');
    const longitude = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseInt(url.searchParams.get('radius') || '5000');
    const category = url.searchParams.get('category');
    const minDiscount = url.searchParams.get('minDiscount');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the raw SQL query with PostGIS
    const query = `
      SELECT
        sale.*,
        ST_Distance(
          sale.location::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography
        ) as distance,
        json_build_object(
          'id', store.id,
          'name', store.name,
          'category', store.category,
          'logo', store.logo,
          'address', store.address,
          'city', store.city
        ) as store
      FROM sales sale
      LEFT JOIN stores store ON sale."storeId" = store.id
      WHERE ST_DWithin(
        sale.location::geography,
        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
        $3
      )
      AND sale.status = 'active'
      AND sale."startDate" <= NOW()
      AND sale."endDate" >= NOW()
      ${category ? `AND sale.category = $4` : ''}
      ${minDiscount ? `AND sale."discountPercentage" >= ${category ? '$5' : '$4'}` : ''}
      ORDER BY distance ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const params = [longitude, latitude, radius];
    if (category) params.push(category);
    if (minDiscount) params.push(parseInt(minDiscount));

    // Execute raw SQL query
    const { data, error } = await supabase.rpc('exec_sql', {
      query,
      params
    });

    if (error) {
      console.error('Database error:', error);
      // Fallback to simple query without distance
      const queryBuilder = supabase
        .from('sales')
        .select(`
          *,
          store:stores(id, name, category, logo, address, city)
        `)
        .eq('status', 'active')
        .lte('startDate', new Date().toISOString())
        .gte('endDate', new Date().toISOString());

      if (category) queryBuilder.eq('category', category);
      if (minDiscount) queryBuilder.gte('discountPercentage', parseInt(minDiscount));

      const { data: fallbackData, error: fallbackError } = await queryBuilder
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (fallbackError) throw fallbackError;

      // Convert images string to array
      const formattedData = (fallbackData || []).map((sale: any) => ({
        ...sale,
        images: sale.images ? sale.images.split(',') : [],
        distance: null,
      }));

      return new Response(JSON.stringify(formattedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert images string to array for each sale
    const formattedData = (data || []).map((sale: any) => ({
      ...sale,
      images: sale.images ? sale.images.split(',') : [],
    }));

    return new Response(JSON.stringify(formattedData), {
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
