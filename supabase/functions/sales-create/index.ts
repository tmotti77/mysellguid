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

    const body = await req.json();
    const { title, description, storeId, category, discountPercentage, originalPrice, salePrice,
            currency, startDate, endDate, images, latitude, longitude } = body;

    // Validate required fields
    if (!title || !description || !storeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, description, storeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('ownerId')
      .eq('id', storeId)
      .single();

    if (storeError || store.ownerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only create sales for your own stores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get store location for sale
    const { data: storeData } = await supabase
      .from('stores')
      .select('latitude, longitude')
      .eq('id', storeId)
      .single();

    const saleLat = latitude || storeData?.latitude;
    const saleLng = longitude || storeData?.longitude;

    // Create GeoJSON location
    const location = saleLat && saleLng ? {
      type: 'Point',
      coordinates: [Number(saleLng), Number(saleLat)]
    } : null;

    // Create sale
    const saleData: any = {
      title,
      description,
      storeId,
      category: category || 'other',
      discountPercentage: discountPercentage || null,
      originalPrice: originalPrice || null,
      salePrice: salePrice || null,
      currency: currency || 'ILS',
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      images: images ? images.join(',') : '',
      latitude: saleLat,
      longitude: saleLng,
      location,
      source: 'store_dashboard',
      views: 0,
      clicks: 0,
      shares: 0,
      saves: 0,
    };

    const { data: newSale, error: createError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (createError) {
      console.error('Create error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format response
    const formattedSale = {
      ...newSale,
      images: newSale.images ? newSale.images.split(',') : [],
    };

    return new Response(JSON.stringify(formattedSale), {
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
