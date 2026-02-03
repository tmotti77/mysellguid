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

    // Use raw INSERT with ST_SetSRID to set the PostGIS location correctly
    const saleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const saleEndDate = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const imagesStr = images ? (Array.isArray(images) ? images.join(',') : images) : '';

    const insertQuery = `
      INSERT INTO sales (id, title, description, "storeId", category, "discountPercentage", "originalPrice", "salePrice", currency, "startDate", "endDate", status, images, latitude, longitude, location, source, views, clicks, shares, saves, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13, $14, ST_SetSRID(ST_Point($14, $13), 4326), 'store_dashboard', 0, 0, 0, 0, $15, $15)
      RETURNING *
    `;

    const params = [
      saleId, title, description, storeId, category || 'other',
      discountPercentage || null, originalPrice || null, salePrice || null,
      currency || 'ILS', startDate || now, saleEndDate,
      imagesStr, Number(saleLat), Number(saleLng), now
    ];

    // Try raw SQL first, fallback to insert without location
    let newSale: any = null;
    let createError: any = null;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: insertQuery, params });
      if (error) throw error;
      newSale = data?.[0];
    } catch {
      // Fallback: insert with EWKT location string
      const saleData: any = {
        id: saleId,
        title, description, storeId,
        category: category || 'other',
        discountPercentage: discountPercentage || null,
        originalPrice: originalPrice || null,
        salePrice: salePrice || null,
        currency: currency || 'ILS',
        startDate: startDate || now,
        endDate: saleEndDate,
        status: 'active',
        images: imagesStr,
        latitude: saleLat, longitude: saleLng,
        location: `SRID=4326;POINT(${Number(saleLng)} ${Number(saleLat)})`,
        source: 'store_dashboard',
        views: 0, clicks: 0, shares: 0, saves: 0,
        createdAt: now, updatedAt: now,
      };

      const result = await supabase.from('sales').insert(saleData).select().single();
      newSale = result.data;
      createError = result.error;
    }

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
